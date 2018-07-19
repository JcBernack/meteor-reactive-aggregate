Package.describe({
  name: 'jcbernack:reactive-aggregate',
  version: '1.1.0',
  // Brief, one-line summary of the package.
  summary: "Reactively publish aggregations.",
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/JcBernack/meteor-reactive-aggregate',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.5');
  api.use(['ecmascript', 'underscore', 'mongo', 'sakulstra:aggregate@1.4.3'], ['server']);

  api.export('ReactiveAggregate', 'server');
  api.mainModule('aggregate.js', 'server');
});
