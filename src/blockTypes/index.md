# Block Types

## Gotchas!

Although this is an incredibly flexible API/design pattern it is important to
make note of some of the caveats. One very important caveat is that you cannot
assign a `name` property. The `name` property of a function is special in
JavaScript, this means you cannot use `displayName` as well, or any potential
keys that would conflict with Function.prototype. So:

```js
blockType( { name: 'text', controls: [ 'bold', 'italicize' ] } )
```

Will throw a TypeError for trying to assign a new value to the read only
property `name`.
