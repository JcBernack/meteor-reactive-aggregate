# meteor-reactive-aggregate

Reactively publish aggregations.

    meteor add jcbernack:reactive-aggregate

This helper can be used to reactively publish the results of an aggregation.

## Usage
    ReactiveAggregate(subscription, collection, pipeline[, options])

- `subscription` should always be `this` in a publication.
- `collection` is the Mongo.Collection instance to query.
- `pipeline` is the aggregation pipeline to execute.
- `options` provides further options:
  - `observeSelector` can be given to improve efficiency. This selector is used for observing the reactive collections. If you wish to have different selectors for multiple reactive collections, use `lookupCollections` options.
  - `observeOptions` can be given to limit fields, further improving efficiency. Ideally used to limit fields on your query.
  - `delay` (default: `250`) the time (in milliseconds) between re-runs caused by changes in any reactive collections in the aggregation.
  - `lookupCollections` is keyed by your `$lookup.from` collection name(s). it takes `observeSelector` and `observeOptions` parameters. see example below.
  If none is given any change to the collection will cause the aggregation to be reevaluated.

### Examples
  `options` applied to the **default** collection
  ```
  const options = {
      observeSelector: {
          bookId: { $exists: true },
      },
      observeOptions: {
          limit: 10,
          sort: { createdAt: -1 },
      }
  };
  ```
  `options` applied to all **$lookup** reactive collections
  ```
  const options = {
      lookupCollections: {
          'books': {
             observeSelector: {
                'releaseDate', { $gte: new Date('2010-01-01') }
             },
             observeOptions: {
                 limit: 10,
                 sort: { createdAt: -1 },
             }
          }
      }
  };
  ```

  - `clientCollection` defaults to `collection._name` but can be overriden to sent the results to a different client-side collection.


## Multiple collections observe
By default, any collection instances passed into the aggregation pipeline as a `Mongo.Collection` instance will be reactive. If you wish to opt out of reactivity for a collection in your pipeline, simply pass the `Collection._name` as a string.

### Example
All collections reactive:
```
const pipeline = [{
    $lookup: {
        from: Books,
        localField: 'bookId',
        foreignField: '_id',
        as: 'books',
    },
    ...
    $lookup: {
        from: Authors,
        localField: 'authorId',
        foreignField: '_id',
        as: 'authors',
    },
    ...
}];
```

Only `Books` collection is reactive:
```
const pipeline = [{
    $lookup: {
        from: Books,
        localField: 'bookId',
        foreignField: '_id',
        as: 'books',
    },
    ...
    $lookup: {
        from: Authors._name,
        localField: 'authorId',
        foreignField: '_id',
        as: 'authors',
    },
    ...
}];
```

## Quick Example

A publication for one of the
[examples](https://docs.mongodb.org/v3.0/reference/operator/aggregation/group/#group-documents-by-author)
in the MongoDB docs would look like this:
```
Meteor.publish("booksByAuthor", function () {
    ReactiveAggregate(this, Books, [{
    $group: {
        _id: "$author",
        books: { $push: "$$ROOT" }
    }
    }]);
});
```

## Extended Example

Define the parent collection you want to run an aggregation on. Let's say:
```
Reports = new Meteor.Collection('Reports');
```

.. in a location where all your other collections are defined, say `lib/collections.js`

Next, prepare to publish the aggregation on the `Reports` collection into another client-side-only collection we'll call, `clientReport`.

Create the `clientReport` in the client side (its needed only for client use). This  collection will be the destination in which the aggregation will be put into upon completion.

Now you publish the aggregation on the server:
```
Meteor.publish("reportTotals", function() {
    // Remember, ReactiveAggregate doesn't return anything
    ReactiveAggregate(this, Reports, [{
        // assuming our Reports collection have the fields: hours, books
        $group: {
            '_id': this.userId,
            'hours': {
            // In this case, we're running summation.
                $sum: '$hours'
            },
            'books': {
                $sum: 'books'
            }
        }
    }, {
        $project: {
            // an id can be added here, but when omitted,
            // it is created automatically on the fly for you
            hours: '$hours',
            books: '$books'
        } // Send the aggregation to the 'clientReport' collection available for client use
    }], { clientCollection: "clientReport" });
});
```

We therefore need to subscribe to the above Publish.
```
Meteor.subscribe("reportTotals");
```

Then in our Template helper:
```
Template.statsBrief.helpers({
    reportTotals: function() {
        console.log("I'm working");
        return clientReport.find();
    },
});
```

Finally, your template:
```
{{#each reportTotals}}Total Hours: {{hours}} <br/>Total Books: {{books}}{{/each}}
```

Your aggregated values will therefore be available in client-side and behave reactively just as you'd expect.

Enjoy aggregating `reactively`!

## Multiple collections observe example
```
Meteor.publish("booksByAuthor", function () {
    ReactiveAggregate(this, Books, [{
    $group: {
        _id: "$author",
        books: { $push: "$$ROOT" }
    }
    }], {
    observeSelector: {
        `${Books._name}`: {
            authorId: { $exists: true },
        }
    }, // for Books
        // for Authors get default: {}
    // observeOptions: {} <- default: all reactive collections get no query options
    );
});
```


