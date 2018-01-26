ReactiveAggregate = function (sub, collection, pipeline, options) {
  var defaultOptions = {
    observeCollections: collection,
    observeSelector: {},
    observeOptions: {},
    clientCollection: collection._name
  };
  options = _.extend(defaultOptions, options);

  var initializing = true;
  sub._ids = {};
  sub._iteration = 1;

  function update() {
    if (initializing) return;
    // add and update documents on the client
    collection.aggregate(pipeline).forEach(function (doc) {
      if (!sub._ids[doc._id]) {
        sub.added(options.clientCollection, doc._id, doc);
      } else {
        sub.changed(options.clientCollection, doc._id, doc);
      }
      sub._ids[doc._id] = sub._iteration;
    });
    // remove documents not in the result anymore
    _.forEach(sub._ids, function (v, k) {
      if (v != sub._iteration) {
        delete sub._ids[k];
        sub.removed(options.clientCollection, k);
      }
    });
    sub._iteration++;
  }

  // track any changes on the collection used for the aggregation
  if (!Array.isArray(options.observeCollections)) {
    // Make array
    var arr = [];
    arr.push(options.observeCollections);
    options.observeCollections = arr;
  }
  // Create observers
  /**
   * @type {Meteor.LiveQueryHandle[]|*}
   */
  var handles = options.observeCollections.map( createObserver );

  /**
   * Create observer
   * @param {Mongo.Collection|*} collection
   * @param {number} i
   * @returns {any|*|Meteor.LiveQueryHandle} Handle
   */
  function createObserver( collection, i) {
    var observeSelector = getObjectFrom(options.observeOptions, i);
    var observeOptions = getObjectFrom(options.observeOptions, i);
    var query = collection.find(observeSelector, observeOptions);
    return handle = query.observeChanges({
      added: update,
      changed: update,
      removed: update,
      error: function (err) {
        throw err;
      }
    });

  }

  /**
   * Get object from array or just object
   * @param {Object|[]} variable
   * @param i
   * @returns {{}}
   */
  function getObjectFrom(variable, i) {
    return Array.isArray(variable)
      ? (
        typeof variable[i] !== 'undefined'
          ? variable[i]
          : {}
      )
      : variable;
  }
  
  // observeChanges() will immediately fire an "added" event for each document in the query
  // these are skipped using the initializing flag
  initializing = false;
  // send an initial result set to the client
  update();
  // mark the subscription as ready
  sub.ready();

  // stop observing the cursor when the client unsubscribes
  sub.onStop(function () {
    handles.map(function (handle) {
      handle.stop();
    });
  });
};
