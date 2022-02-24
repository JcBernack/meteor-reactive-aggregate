import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Mongo.Collection.prototype.aggregate = function(pipeline, options) {
  const collection = this.rawCollection();
  return collection.aggregate.bind(collection)(pipeline, options);
}
