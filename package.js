Package.describe({
  name: "jcbernack:reactive-aggregate",
  version: "0.6.0",
  // Brief, one-line summary of the package.
  summary: "Reactively publish aggregations.",
  // URL to the Git repository containing the source code for this package.
  git: "https://github.com/JcBernack/meteor-reactive-aggregate",
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: "README.md"
});

Package.onUse(function(api) {
  api.versionsFrom("1.2.1");
  api.use("underscore");
  api.use("mongo");
  api.use("meteorhacks:aggregate@1.3.0");
  api.addFiles("aggregate.js");
  api.export("ReactiveAggregate");
});
