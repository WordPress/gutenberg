# Scope your code

Historically, JavaScript files loaded in a web page share the same scope. This means that a global variable declared in one file will be seen by the code in other files.

To see how this works, create a web page that loads three JavaScript files. The `first.js` file will be:

```js
var pluginName = 'MyPlugin';
console.log( 'Plugin name is ', pluginName );
```

Let's create `second.js` as:

```js
var pluginName = 'DifferentPlugin';
console.log( 'Plugin name is ', pluginName );
```

And, finally, `third.js`:

```js
console.log( 'Plugin name is ', pluginName );
```

When loaded on the same page, `first.js` and `second.js` will output the plugin name declared within itself. They will override the value of the global `pluginName` variable if one was already declared. It's not known what gets printed in the console when `third.js` is executed, though - it depends on the value of the global `pluginName` variable when `third.js` is executed, which will depend on the order the files are loaded.

This behavior can be problematic, and is the reason we need to scope the code. By scoping the code—ensuring each file is isolated from each other—we can prevent values unexpectedly changing.

## Scoping code within a function

In JavaScript, you can scope your code by writing it within a function. Functions have "local scope", or a scope that is specific only to that function. Aditionally, in JavaScript you can write anonymous functions, functions without a name, which will also prevent your function name from being overridden in the global scope.

Taking advantage of these two JavaScript features, `first.js` could be scoped as:

```js
function() {
	var pluginName = 'MyPlugin';
	console.log( 'Plugin name is ', pluginName );
}
```

`second.js` as:

```js
function() {
	var pluginName = 'DifferentPlugin';
	console.log( 'Plugin name is ', pluginName );
}
```

And `third.js`:

```js
function() {
	console.log( 'Plugin name is ', pluginName );
}
```

With this trick, the different files won't override each other's variables. Unfortunately, they also won't work as expected, because these functions are being called by no one. We've only _defined_ the functions; we haven't _executed_ them yet.

## Automatically execute anonymous functions

It turns out there are a few ways to execute anonymous functions in JavaScript, but the most popular is this:

```js
( function() {
	// your code goes here
} )( )
```

You wrap your function between parentheses, and then call it like any other named function. This pattern is known as [Immediately-Invoked Function Expression](http://benalman.com/news/2010/11/immediately-invoked-function-expression/), or IIFE for short.

This is `first.js` written as an IIFE:

```js
( function() {
	var pluginName = 'MyPlugin';
	console.log( 'Plugin name is ', pluginName );
} )( )
```

And this is `second.js`:

```js
( function() {
	var pluginName = 'DifferentPlugin';
	console.log( 'Plugin name is ', pluginName );
} )( )
```

And this is `third.js`:

```js
( function() {
	console.log( 'Plugin name is ', pluginName );
} )( )
```

The code in `first.js` and `second.js` is unaffected by other variables in the global scope, so it's safe and deterministic.

On the other hand, `third.js` doesn't declare a `pluginName` variable, but needs to be provided one. IIFEs still allow you to take a variable from the global scope and pass it into your function. Provided that there was a global `window.pluginName` variable, we could rewrite `third.js` as:

```js
( function( name ) {
	console.log( 'Plugin name is ', name );
} )( window.pluginName )
```

## Future changes

At the beginning we mentioned that:

> Historically, JavaScript files loaded in a web page share the same scope.

Notice the _historically_.

JavaScript has evolved quite a bit since its creation. As of 2015, the language supports modules, also known as _ES6 modules_, that introduce separate scope per file: a global variable in `first.js` wouldn't be exposed to `second.js`. This feature is already [supported by modern browsers](https://caniuse.com/#feat=es6-module), but not all of them do. If your code needs to run in browsers that don't support modules, your last resort is using IIFEs.
