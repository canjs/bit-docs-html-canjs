## Initial install: 

```
npm install
```

## Generate example site:

```
node make-example.js -f
```

## Start a simple server: 

```
http-server
```

Site will be available at `http://127.0.0.1:8080/`

## Change Styles

Edit styles in _static/canjs.less_.
Delete _node_modules/bit-docs-generate-html/site/static_. Re-run:

```
node make-example.js -f
```


## Use this in main CanJS.

1. open _package.json_, increment the version number.
2. commit and push to master.
3. run `npm publish`
4. Open _canjs/package.json_. Update `"bit-docs-html-canjs"`'s version.
5. In canjs, run `./node_modules/.bin/bit-docs -df`
