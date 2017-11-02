var localStorageIsAvailable = (function() {
  try {
    var testKey = Math.random();
    var testValue = '*';
    window.localStorage.setItem(testKey, testValue);
    var isAvailable = window.localStorage.getItem(testKey) === testValue;
    window.localStorage.removeItem(testKey);
    return isAvailable;
  } catch (error) {
    return false;
  }
})();

module.exports = (localStorageIsAvailable) ? window.localStorage : (function() {
  var storage = {};
  return {
    clear: function() {
      storage = {};
    },
    getItem: function(keyName) {
      return storage[keyName];
    },
    removeItem: function(keyName) {
      delete storage[keyName];
    },
    setItem: function(keyName, keyValue) {
      storage[keyName] = keyValue;
    }
  };
})();
