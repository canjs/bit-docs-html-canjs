var lunr = require("lunr");
var searchEngine;

module.exports = {
	indexData: function(items) {
		searchEngine = lunr(function() {
			lunr.tokenizer.separator = /[\s]+/;

			this.pipeline.remove(lunr.stemmer);
			this.pipeline.remove(lunr.stopWordFilter);
			this.pipeline.remove(lunr.trimmer);
			this.searchPipeline.remove(lunr.stemmer);

			this.ref('name');
			this.field('title');
			this.field('concatenatedName');
			this.field('description');
			this.field('isPackage');
			this.field('name');
			this.field('url');
			this.field('isCorePackage');
			this.field('isInfrastructurePackage');
			this.field('isLegacyPackage');
			this.field('isPage');

			this.field('type');
			

			items.forEach(function(item) {
				if (!item.title) {
					item.title = item.name;
				}
				item.concatenatedName = item.name.replace('can-', '').replace(/-/g, '').replace(/\//g, '');
				item.isPackage = (item.collection !== undefined).toString();
				item.isCorePackage = (item.collection === 'can-core').toString();
				item.isInfrastructurePackage = (item.collection === 'can-infrastructrue').toString();
				item.isLegacyPackage = (item.collection === 'can-legacy').toString();
				item.isPage = (item.type === 'page').toString();
				this.add(item);
			}.bind(this));
		});
		return searchEngine;
	},

	loadIndex: function(index) {
		return lunr.Index.load(index);
	},

	search: function(value) {
		var HELPER_START_PATTERN = /^#[a-z]/;
		var searchTerm = value.toLowerCase();

		var isHelper = false;

		if (HELPER_START_PATTERN.test(searchTerm)) {
			searchTerm = value.substr(1, value.length)
			isHelper = true;
		}



		//run the search
		return searchEngine.query(function(q) {

			if (searchTerm.indexOf('can-') > -1) {// If the search term includes “can-”

				// look for an exact match and apply a large positive boost
				q.term(searchTerm, { boost: 375 });

			} else {
				if (isHelper) {
					// Boost functions if it is a helper
					q.term('function', { boost: 14, fields: ['type'] });
				}
				// add “can-”, look for an exact match in the title field, and apply a positive boost
				// can-core package have highest boost
				q.term(['can-' + searchTerm, 'true'], { boost: 12, fields: ['isCorePackage'] });

				q.term(['can-' + searchTerm, 'true'], { boost: 8, fields: ['isInfrastructurePackage'] });

				q.term(['can-' + searchTerm, 'true'], { boost: 6, fields: ['isLegacyPackage'] });

				// look for terms that match the beginning or end of this query
				q.term(searchTerm, { wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING });

				// look in the title field specifically to boost matches in it
				q.term(searchTerm, { fields: ['title'], wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING });

				// support searches for strings like “restModel”
				q.term(searchTerm, { fields: ['concatenatedName'], wildcard: lunr.Query.wildcard.TRAILING });

				// favor modules
				q.term('true', { boost: 6, fields: ['isPackage'] });

				// Boot core modules a bit
				q.term('true', { boost: 16, fields: ['isCorePackage'] });

				// Give a boost to infrastructure modules
				q.term('true', { boost: 10, fields: ['isInfrastructurePackage'] });

				// Give a boost to legacy modules
				q.term('true', { boost: 18, fields: ['isLegacyPackage'] });
				
				// Give page a boost so they can always be in results if title matchs 
				q.term('page', { boost: 28, fields: ['type'] });
				q.term('typedef', { boost: 12, fields: ['type'] });

				q.term('function', { boost: 12, fields: ['type'] });
			}

			// look for matches in any of the fields and apply a medium positive boost
			var split = searchTerm.split(lunr.tokenizer.separator);
			split.forEach(function(term) {
				q.term(term, { boost: 10, fields: q.allFields });
				q.term(term, { fields: q.allFields, wildcard: lunr.Query.wildcard.TRAILING });
			});
		});
	}
};
