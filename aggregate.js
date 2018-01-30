import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

const defaultOptions = ({
  collection, options
}) => ({
  observeSelector: {},
  observeOptions: {},
  delay: 250,
  lookupCollections: {},
  clientCollection: collection._name,
  ...options
});

export const ReactiveAggregate = function (subscription, collection, pipeline = [], options = {}) {
  // fill out default options
  const {
    observeSelector, observeOptions, delay, lookupCollections, clientCollection
  } = defaultOptions({
    collection,
    options
  });

  // run, or re-run, the aggregation pipeline
  const throttledUpdate = _.throttle(Meteor.bindEnvironment(() => {
    // add and update documents on the client
    collection.aggregate(safePipeline).forEach((doc) => {
      if (!subscription._ids[doc._id]) {
        subscription.added(clientCollection, doc._id, doc);
      } else {
        subscription.changed(clientCollection, doc._id, doc);
      }
      subscription._ids[doc._id] = subscription._iteration;
    });
    // remove documents not in the result anymore
    _.each(subscription._ids, (iteration, key) => {
      if (iteration != subscription._iteration) {
        delete subscription._ids[key];
        subscription.removed(clientCollection, key);
      }
    });
    subscription._iteration++;
  }), delay);
  const update = () => !initializing ? throttledUpdate() : null;

  // don't update the subscription until __after__ the initial hydrating of our collection
  let initializing = true;
  // mutate the subscription to ensure it updates as we version it
  subscription._ids = {};
  subscription._iteration = 1;

  // create a list of collections to watch and make sure
  // we create a sanitized "strings-only" version of our pipeline
  const observerHandles = [createObserver(collection, { observeSelector, observeOptions })];
  // look for $lookup collections passed in as Mongo.Collection instances
  // and create observers for them
  // if any $lookup.from stages are passed in as strings they will be omitted
  // from this process. the aggregation will still work, but those collections
  // will not force an update to this query if changed.
  const safePipeline = pipeline.map((stage) => {
    if (stage.$lookup && stage.$lookup.from instanceof Mongo.Collection) {
      const collection = stage.$lookup.from;
      observerHandles.push(createObserver(collection, lookupCollections[collection._name]));
      return {
        ...stage,
        $lookup: {
          ...stage.$lookup,
          from: collection._name
        }
      };
    }
    return stage;
  });

  // observeChanges() will immediately fire an "added" event for each document in the query
  // these are skipped using the initializing flag
  initializing = false;
  // send an initial result set to the client
  update();
  // mark the subscription as ready
  subscription.ready();
  // stop observing the cursor when the client unsubscribes
  subscription.onStop(() => observerHandles.map((handle) => handle.stop()));

  /**
	 * Create observer
	 * @param {Mongo.Collection|*} collection
	 * @returns {any|*|Meteor.LiveQueryHandle} Handle
	 */
  function createObserver(collection, queryOptions) {
    const { observeSelector, observeOptions } = queryOptions;
    const selector = observeSelector || {};
    const options = observeOptions || {};
    const query = collection.find(selector, options);
    return query.observeChanges({
      added: update,
      changed: update,
      removed: update,
      error: (err) => {
        throw err;
      }
    });
  }
};
