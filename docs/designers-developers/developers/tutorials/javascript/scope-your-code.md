# Scope your code

Historically, JavaScript files loaded by same document share the same scope. This means that a global variable declared in a file will be seen by the code in other files.

This is `one.js` file:

```js
var yourPluginName = 'MyPlugin';
console.log( 'Plugin name is ', yourPluginName );
```

This is `two.js` file:

```js
var yourPluginName = 'YourPlugin';
var yourName = 'A great JS developer!';
console.log( 'Plugin ', yourPluginName, ' authored by ', yourName );
```

If you load them both in a page, they'll overwrite each other global variables.

**First step: scope the code within a function**

In order to fix this, you need to scope your code. In JavaScript you do this by writing it within a function, because they create a _local scope_. And, to prevent polluting the global scope with your function's name, you should write your code within an _anonymous_ function.

Scoped `one.js` code:

```js
function() {
	var yourPluginName = 'my plugin';
	console.log( 'Plugin name is ', yourPluginName );
}
```

And `two.js`:

```js
function() {
	var yourName = 'A great JS developer!';
	console.log( 'Plugin ', yourPluginName, ' authored by ', yourName );
}
```

With this trick, the different files won't override each other. They also won't work as intended! Nothing will be displayed in the console because these functions are being called by no one.

**2. Make it so the functions is executed when is loaded**

The problem is, how do you execute anonymous functions in JavaScript? It turns out there are a few ways, but the most popular is this:

```js
( function() {
	// your code goes here
} )()
```

You wrap your function between parenthesis, and then call it like any other named function. This pattern is know as [Immediately-Invoked Function Expression](http://benalman.com/news/2010/11/immediately-invoked-function-expression/), or IIFE for short.

This is `one.js` written as an IIFE:

```js
( function() {
	var yourPluginName = 'my plugin';
	console.log( 'Plugin name is ', yourPluginName );
} )( )
```

And this is `two.js`:

```js
( function() {
	var yourName = 'A great JS developer!';
	console.log( 'Plugin ', yourPluginName, ' authored by ', yourName );
} )( )
```

It's important not to forget that these are just regular functions, so they can take parameters:

```js
( function( wordpress ) {
	console.log( 'WordPress is ', wordpress );
} )( window.wp )
```

**Coda**

At the beginning we mentioned that:

	> Historically, JavaScript files loaded by same document share the same scope.

Notice the _historically_.

JavaScript has evolved quite a bit since its creation. As of 2015 the language supports modules, also known as _ES6 modules_, that introduce separate scope per file: a global variable in `one.js` wouldn't be exposed to `two.js`. This feature is already [supported by modern browsers](https://caniuse.com/#feat=es6-module), but not all of them do. If your code needs to run in browsers that don't support modules, your last resort is using IIFEs.
