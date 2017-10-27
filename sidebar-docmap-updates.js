var fs = require('fs');

var docMap = JSON.parse(fs.readFileSync('./docMap.json'));

var newGroupings = [
  {
    children: ['can-compute', 'can-define', 'can-define-stream', 'can-define-stream-kefir', 'can-define/list/list', 'can-define/map/map', 'can-event', 'can-event/async/async', 'can-event/batch/batch', 'can-event/lifecycle/lifecycle', 'can-kefir', 'can-list', 'can-map', 'can-map-backup', 'can-map-define', 'can-observation', 'can-observe', 'can-simple-map', 'can-simple-observable', 'can-stream', 'can-stream-kefir'],
    name: 'can-observables',
    title: 'Observables'
  },
  {
    children: ['can-connect', 'can-connect-cloneable', 'can-connect-feathers', 'can-connect-ndjson', 'can-connect-signalr', 'can-fixture', 'can-fixture-socket', 'can-ndjson-stream', 'can-set'],
    name: 'can-data-modeling',
    title: 'Data Modeling'
  },
  {
    children: ['can-component', 'can-ejs', 'can-element', 'can-react-component', 'can-stache', 'can-stache-bindings', 'can-stache-converters', 'can-view-autorender', 'can-view-callbacks', 'can-view-href', 'can-view-import', 'can-view-live', 'can-view-model', 'can-view-nodelist', 'can-view-parser', 'can-view-scope', 'can-view-target', 'react-view-model', 'react-view-model/component', 'steal-stache'],
    name: 'can-views',
    title: 'Views'
  },
  {
    children: ['can-deparam', 'can-param', 'can-route', 'can-route-pushstate', 'can-stache/helpers/route'],
    name: 'can-routing',
    title: 'Routing'
  },
  {
    children: ['can-ajax', 'can-assign', 'can-globals', 'can-make-map', 'can-parse-uri', 'can-test-helpers', 'can-util', 'can-zone', 'can-zone-storage'],
    name: 'can-js-utilities',
    title: 'JS Utilities'
  },
  {
    children: ['can-attribute-encoder', 'can-control', 'can-dom-events', 'can-event-dom-enter', 'can-event-dom-radiochange', 'can-jquery'],
    name: 'can-dom-utilities',
    title: 'DOM Utilities'
  },
  {
    children: ['can-define-validate-validatejs', 'can-validate', 'can-validate-interface', 'can-validate-legacy', 'can-validate-validatejs'],
    name: 'can-data-validation',
    title: 'Data Validation'
  },
  {
    children: ['can-cid', 'can-construct', 'can-construct-super', 'can-namespace', 'can-reflect', 'can-reflect-promise', 'can-types'],
    name: 'can-typed-data',
    title: 'Typed Data'
  },
  {
    children: ['can-symbol', 'can-vdom'],
    name: 'can-polyfills',
    title: 'Polyfills'
  }
];

newGroupings.forEach(function(grouping, order) {
  docMap[grouping.name] = {
    "src": {
      "path": "docs/can-canjs/" + grouping.name + ".md"
    },
    "body": "",
    "description": grouping.name,
    "name": grouping.name,
    "title": grouping.title,
    "type": "group",
    "parent": "api",
    "order": order,
    "comment": " "
  };
  grouping.children.forEach(function(child) {
    var childModule = docMap[child];
    if (!childModule.collection) {
      childModule.collection = childModule.parent.substr(4);
    }
    childModule.parent = grouping.name;
  });
});

docMap['can-core']['parent'] = null;
docMap['can-ecosystem']['parent'] = null;
docMap['can-infrastructure']['parent'] = null;
docMap['can-legacy']['parent'] = null;

fs.writeFileSync('./docMap.json', JSON.stringify(docMap, null, 2));

console.info('Finished!');
