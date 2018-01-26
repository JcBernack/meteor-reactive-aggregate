ReactiveAggregate = function (sub, collection, pipeline, options) {
  var defaultOptions = {
    observeSelector: {},
    clientCollection: collection._name,
    throttleWait: 250
  };
  options = _.extend(defaultOptions, options);

  var initializing = true;
  sub._ids = {};
  sub._iteration = 1;

  var doUpdate = _.throttle(Meteor.bindEnvironment(function() {
    try {
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
        if (v !== sub._iteration) {
          delete sub._ids[k];
          sub.removed(options.clientCollection, k);
        }
      });
      sub._iteration++;
    }
    catch (e) {
      if (handle) handle.stop();
      sub.error(e);
    }
  }), options.throttleWait);

  function update() {
    if (!initializing) doUpdate();
  }

  // track any changes on the collection used for the aggregation
  var query = collection.find(options.observeSelector);
  var handle = query.observeChanges({
    added: update,
    changed: update,
    removed: update,
    error: function (err) {
      throw err;
    }
  });
  // observeChanges() will immediately fire an "added" event for each document in the query
  // these are skipped using the initializing flag
  initializing = false;
  // send an initial result set to the client
  update();
  // mark the subscription as ready
  sub.ready();

  // stop observing the cursor when the client unsubscribes
  sub.onStop(function () {
    handle.stop();
  });
};
