# bit-docs-html-canjs

[![Sauce Labs Test Status](https://saucelabs.com/browser-matrix/bit-docs-html-canjs.svg)](https://saucelabs.com/u/bit-docs-html-canjs)

[![Build Status](https://travis-ci.org/canjs/bit-docs-html-canjs.svg?branch=master)](https://travis-ci.org/canjs/bit-docs-html-canjs)
[![npm version](https://badge.fury.io/js/bit-docs-html-canjs.svg)](https://www.npmjs.com/package/bit-docs-html-canjs)

## Initial install:

```
npm install
```

## Generate example site:

```
npm start
```

## Start a simple server:

```
http-server
```

Site will be available at `http://127.0.0.1:8080/`

## Change Styles

```
npm run styles
```

## Use this in main CanJS.

1. open _package.json_, increment the version number.
2. commit and push to master.
3. run `npm publish`
4. Open _canjs/package.json_. Update `"bit-docs-html-canjs"`'s version.
5. In canjs, run `./node_modules/.bin/bit-docs -df`
