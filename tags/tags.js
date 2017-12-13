module.exports = {
    subchildren: require('./subchildren'),
    collection: {
        add: function( line, curData, scope, objects, currentWrite, siteConfig ){
            return siteConfig.tags._default.add.apply(this, arguments);
        }
    },
    outline: {
        add: function( line, curData, scope, objects, currentWrite, siteConfig ){
            return siteConfig.tags._default.add.apply(this, arguments);
        }
    }
};
