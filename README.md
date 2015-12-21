# meteor-reactive-aggregate

Reactively publish aggregations.

    meteor add jcbernack:reactive-aggregate

This helper can be used to reactively publish the results of an aggregation.

## Usage
    ReactiveAggregate(sub, collection, pipeline, options)

- `sub` should always be `this` in a publication.
- `collection` is the Mongo.Collection instance to query.
- `pipeline` is the aggregation pipeline to execute.
- `options` provides further options:
  - `observeSelector` can be given to improve efficiency. This selector is used for observing the collection.
  If none is given any change to the collection will cause the aggregation to be reevaluated.
  - `clientCollection` defaults to `collection._name` but can be overriden to sent the results
  to a different client-side collection. 

## Example

A publication for one of the
[examples](https://docs.mongodb.org/v3.0/reference/operator/aggregation/group/#group-documents-by-author)
in the MongoDB docs would look like this:

    Meteor.publish("booksByAuthor", function () {
      ReactiveAggregate(this, Books, [{
        $group: {
          _id: "$author",
          books: { $push: "$$ROOT" }
        }
      }]);
    });
