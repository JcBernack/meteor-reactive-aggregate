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

## Quick Example

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

## Extended Example

Define the parent collection you want to run an aggregation on. Let's say:

`Reports = new Meteor.Collection('Reports');`

.. in a location where all your other collections are defined, say `lib/collections.js`

Next, prepare to publish the aggregation on the `Reports` collection into another client-side-only collection we'll call, `clientReport`.

Create the `clientReport` in the client side (its needed only for client use). This  collection will be the destination in which the aggregation will be put into upon completion.

Now you publish the aggregation on the server:

    Meteor.publish("reportTotals", function() {
    // Remember, ReactiveAggregate doesn't return anything
    ReactiveAggregate(this, Reports, [{
        // assuming our Reports collection have the field: hours
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
    
We therefore need to subscribe to the above Publish.

`Meteor.subscribe("reportTotals");`

Then in our Template helper:

    Template.statsBrief.helpers({
        reportTotals: function() {
            console.log("I'm working");
            return clientReport.find();
        },
    });

Finally, your template:

    {{#each reportTotals}}Total Hours: {{hours}} <br/>Total Books: {{books}}{{/each}}

Your aggregated values will therefore be available in client-side and behave reactively just as you'd expect.

Enjoy aggregating `reactively`!
