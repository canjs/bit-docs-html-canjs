var logic = require('static/search-logic');
var searchEngine;

self.addEventListener('message', function(message) {
	var data = message.data;

	switch (data.name) {
		case 'index data':
			self.postMessage({
				name: 'search engine ready',
				searchEngine: logic.indexData(data.items)
			});
			break;

		case 'load index':
			self.postMessage({
				name: 'search engine ready',
				searchEngine: logic.loadIndex(data.index)
			});
			break;

		case 'search':
			self.postMessage({
				name: 'search results',
				results: logic.search(data.query),
				query: data.query
			});
			break;

		default:
			console.info('Worker received message:', message);
	}
}, false);
