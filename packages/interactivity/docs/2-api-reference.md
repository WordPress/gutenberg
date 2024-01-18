# API Reference

To add interactivity to blocks using the Interactivity API, developers can use:

- **Directives** - added to the markup to add specific behavior to the DOM elements of the block.
- **Store** - that contains the logic and data (state, actions, or side effects, among others) needed for the behavior.

DOM elements are connected to data stored in the state and context through directives. If data in the state or context change directives will react to those changes, updating the DOM accordingly (see [diagram](https://excalidraw.com/#json=T4meh6lltJh6TCX51NTIu,DmIhxYSGFTL_ywZFbsmuSw)).

![State & Directives](assets/state-directives.png)

## Table of Contents

- [The directives](#the-directives)
  - [List of Directives](#list-of-directives)
    - [`wp-interactive`](#wp-interactive) ![](https://img.shields.io/badge/DECLARATIVE-afd2e3.svg)
    - [`wp-context`](#wp-context) ![](https://img.shields.io/badge/STATE-afd2e3.svg)
    - [`wp-bind`](#wp-bind) ![](https://img.shields.io/badge/ATTRIBUTES-afd2e3.svg)
    - [`wp-class`](#wp-class) ![](https://img.shields.io/badge/ATTRIBUTES-afd2e3.svg)
    - [`wp-style`](#wp-style) ![](https://img.shields.io/badge/ATTRIBUTES-afd2e3.svg)
    - [`wp-text`](#wp-text) ![](https://img.shields.io/badge/CONTENT-afd2e3.svg)
    - [`wp-on`](#wp-on) ![](https://img.shields.io/badge/EVENT_HANDLERS-afd2e3.svg)
    - [`wp-watch`](#wp-watch) ![](https://img.shields.io/badge/SIDE_EFFECTS-afd2e3.svg)
    - [`wp-init`](#wp-init) ![](https://img.shields.io/badge/SIDE_EFFECTS-afd2e3.svg)
    - [`wp-run`](#wp-run) ![](https://img.shields.io/badge/SIDE_EFFECTS-afd2e3.svg)
    - [`wp-key`](#wp-key) ![](https://img.shields.io/badge/TEMPLATING-afd2e3.svg)
  - [Values of directives are references to store properties](#values-of-directives-are-references-to-store-properties)
- [The store](#the-store)
  - [Elements of the store](#elements-of-the-store)
    - [State](#state)
    - [Actions](#actions)
    - [Side Effects](#side-effects)
  - [Setting the store](#setting-the-store)
    - [On the client side](#on-the-client-side)
    - [On the server side](#on-the-server-side)

## The directives

Directives are custom attributes that are added to the markup of your block to add behavior to its DOM elements. This can be done in the `render.php` file (for dynamic blocks) or the `save.js` file (for static blocks).

Interactivity API directives use the `data-` prefix.

_Example of directives used in the HTML markup_

```html
<div
  data-wp-interactive='{ "namespace": "myPlugin" }'
  data-wp-context='{ "isOpen": false }'
  data-wp-watch="callbacks.logIsOpen"
>
  <button
    data-wp-on--click="actions.toggle"
    data-wp-bind--aria-expanded="context.isOpen"
    aria-controls="p-1"
  >
    Toggle
  </button>
 
  <p id="p-1" data-bind--hidden="!context.isOpen">
    This element is now visible!
  </p>
</div>
```

Directives can also be injected dynamically using the [HTML Tag Processor](https://make.wordpress.org/core/2023/03/07/introducing-the-html-api-in-wordpress-6-2).

### List of Directives

With directives, we can directly manage behavior related to things such as side effects, state, event handlers, attributes or content.

#### `wp-interactive` 

The `wp-interactive` directive "activates" the interactivity for the DOM element and its children through the Interactivity API (directives and store). It includes a namespace to reference a specific store.

```html
<!-- Let's make this element and its children interactive and set the namespace -->
<div 
  data-wp-interactive='{ "namespace": "myPlugin" }'
  data-wp-context='{ "myColor" : "red", "myBgColor": "yellow" }'
>
  <p>I'm interactive now, <span data-wp-style--background-color="context.myBgColor">>and I can use directives!</span></p>
  <div>
    <p>I'm also interactive, <span data-wp-style--color="context.myColor">and I can also use directives!</span></p>
  </div>
</div>
```

> **Note**
> The use of `data-wp-interactive` is a requirement for the Interactivity API "engine" to work. In the following examples the `data-wp-interactive` has not been added for the sake of simplicity. Also, the `data-wp-interactive` directive will be injected automatically in the future.

#### `wp-context` 

It provides a **local** state available to a specific HTML node and its children.

The `wp-context` directive accepts a stringified JSON as a value.

_Example of `wp-context` directive_ 

```php
//render.php
<div data-wp-context='{ "post": { "id": <?php echo $post->ID; ?> } }' >
  <button data-wp-on--click="actions.logId" >
    Click Me!
  </button>
</div>
```

<details>
  <summary><em>See store used with the directive above</em></summary>

```js
store( "myPlugin", {
  actions: {
    logId: () => {
      const { post } = getContext();
      console.log( post.id );
    },
  },
} );
```

</details>
<br/>

Different contexts can be defined at different levels, and deeper levels will merge their own context with any parent one:

```html
<div data-wp-context="{ foo: 'bar' }">
  <span data-wp-text="context.foo"><!-- Will output: "bar" --></span>

  <div data-wp-context="{ bar: 'baz' }">
    <span data-wp-text="context.foo"><!-- Will output: "bar" --></span>

    <div data-wp-context="{ foo: 'bob' }">
      <span data-wp-text="context.foo"><!-- Will output: "bob" --></span>
    </div>

  </div>
</div>
```

#### `wp-bind` 

It allows setting HTML attributes on elements based on a boolean or string value.

> This directive follows the syntax `data-wp-bind--attribute`.

_Example of `wp-bind` directive_ 

```html
<li data-wp-context='{ "isMenuOpen": false }'>
  <button
    data-wp-on--click="actions.toggleMenu"
    data-wp-bind--aria-expanded="context.isMenuOpen"
  >
    Toggle
  </button>
  <div data-wp-bind--hidden="!context.isMenuOpen">
    <span>Title</span>
    <ul>
      SUBMENU ITEMS
    </ul>
  </div>
</li>
```

<details>
  <summary><em>See store used with the directive above</em></summary>

```js
store( "myPlugin", {
  actions: {
    toggleMenu: () => {
      const context = getContext();
      context.isMenuOpen = !context.isMenuOpen;
    },
  },
} );
```

</details>
<br/>

The `wp-bind` directive is executed:

- When the element is created. 
- Each time there's a change on any of the properties of the `state` or `context` involved in getting the final value of the directive (inside the callback or the expression passed as reference).

When `wp-bind` directive references a callback to get its final value: 

- The `wp-bind` directive will be executed each time there's a change on any of the properties of the `state` or `context` used inside this callback.
- The returned value in the callback function is used to change the value of the associated attribute.

The `wp-bind` will do different things over the DOM element is applied, depending on its value:

  - If the value is `true`, the attribute is added: `<div attribute>`.
  - If the value is `false`, the attribute is removed: `<div>`.
  - If the value is a string, the attribute is added with its value assigned: `<div attribute="value"`.
  - If the attribute name starts with `aria-` or `data-` and the value is boolean (either `true` or `false`), the attribute is added to the DOM with the boolean value assigned as a string: `<div aria-attribute="true">`.

#### `wp-class` 

It adds or removes a class to an HTML element, depending on a boolean value.

> This directive follows the syntax `data-wp-class--classname`.

_Example of `wp-class` directive_ 

```html
<div>
  <li 
    data-wp-context='{ "isSelected": false }'
    data-wp-on--click="actions.toggleSelection"
    data-wp-class--selected="context.isSelected"
  >
    Option 1
  </li>
  <li 
    data-wp-context='{ "isSelected": false }'
    data-wp-on--click="actions.toggleSelection"
    data-wp-class--selected="context.isSelected"
  >
    Option 2
  </li>
</div>
```

<details>
  <summary><em>See store used with the directive above</em></summary>

```js
store( "myPlugin", {
  actions: {
    toggleSelection: () => {
      const context = getContext();
      context.isSelected = !context.isSelected
    }
  }
} );
```

</details>
<br/>

The `wp-class` directive is executed:

- When the element is created.
- Each time there's a change on any of the properties of the `state` or `context` involved in getting the final value of the directive (inside the callback or the expression passed as reference).

When `wp-class` directive references a callback to get its final boolean value, the callback receives the class name: `className`.

The boolean value received by the directive is used to toggle (add when `true` or remove when `false`) the associated class name from the `class` attribute.

#### `wp-style` 

It adds or removes inline style to an HTML element, depending on its value.

> This directive follows the syntax `data-wp-style--css-property`.

_Example of `wp-style` directive_ 

```html
<div data-wp-context='{ "color": "red" }' >
  <button data-wp-on--click="actions.toggleContextColor">Toggle Color Text</button>
  <p data-wp-style--color="context.color">Hello World!</p>
</div>
>
```

<details>
  <summary><em>See store used with the directive above</em></summary>

```js
store( "myPlugin", {
  actions: {
    toggleContextColor: () => {
      const context = getContext();
      context.color = context.color === 'red' ? 'blue' : 'red';
    },
  },
} );
```

</details>
<br/>

The `wp-style` directive is executed:

- When the element is created.
- Each time there's a change on any of the properties of the `state` or `context` involved in getting the final value of the directive (inside the callback or the expression passed as reference).

When `wp-style` directive references a callback to get its final value, the callback receives the class style property: `css-property`.

The value received by the directive is used to add or remove the style attribute with the associated CSS property: :

- If the value is `false`, the style attribute is removed: `<div>`.
- If the value is a string, the attribute is added with its value assigned: `<div style="css-property: value;">`.

#### `wp-text` 

It sets the inner text of an HTML element.

```html
<div data-wp-context='{ "text": "Text 1" }'>
  <span data-wp-text="context.text"></span>
  <button data-wp-on--click="actions.toggleContextText">
    Toggle Context Text
  </button>
</div>
```

<details>
  <summary><em>See store used with the directive above</em></summary>

```js
store( "myPlugin", {
  actions: {
    toggleContextText: () => {
      const context = getContext();
      context.text = context.text === 'Text 1' ? 'Text 2' : 'Text 1';
    },
  },
} );
```

</details>
<br/>

The `wp-text` directive is executed:

- When the element is created.
- Each time there's a change on any of the properties of the `state` or `context` involved in getting the final value of the directive (inside the callback or the expression passed as reference).

The returned value is used to change the inner content of the element: `<div>value</div>`.

#### `wp-on` 

It runs code on dispatched DOM events like `click` or `keyup`. 

> The syntax of this directive is `data-wp-on--[event]` (like `data-wp-on--click` or `data-wp-on--keyup`).

_Example of `wp-on` directive_ 

```php
<button data-wp-on--click="actions.logTime" >
  Click Me!
</button>
```

<details>
  <summary><em>See store used with the directive above</em></summary>

```js
store( "myPlugin", {
  actions: {
    logTime: ( event ) => {
      console.log( new Date() )
    },
  },
} );
```

</details>
<br/>

The `wp-on` directive is executed each time the associated event is triggered. 

The callback passed as the reference receives [the event](https://developer.mozilla.org/en-US/docs/Web/API/Event) (`event`), and the returned value by this callback is ignored.

#### `wp-watch` 

It runs a callback **when the node is created and runs it again when the state or context changes**. 

You can attach several side effects to the same DOM element by using the syntax `data-wp-watch--[unique-id]`. _The unique id doesn't need to be unique globally, it just needs to be different than the other unique ids of the `wp-watch` directives of that DOM element._

_Example of `wp-watch` directive_

```html
<div 
  data-wp-context='{ "counter": 0 }'
  data-wp-watch="callbacks.logCounter"
>
  <p>Counter: <span data-wp-text="context.counter"></span></p>
  <button data-wp-on--click="actions.increaseCounter">+</button>
  <button data-wp-on--click="actions.decreaseCounter">-</button>
</div>
```

<details>
  <summary><em>See store used with the directive above</em></summary>

```js
store( "myPlugin", {
  actions: {
    increaseCounter: () => {
      const context = getContext();
      context.counter++;
    },
    decreaseCounter: () => {	
      const context = getContext();
      context.counter--;
    },
  },
  callbacks: {
    logCounter: () => {
      const { counter } = getContext(); 
      console.log("Counter is " + counter + " at " + new Date() );
    },
  },
} );
```

</details>
<br/>

The `wp-watch` directive is executed:

- When the element is created.
- Each time that any of the properties of the `state` or `context` used inside the callback changes.

The `wp-watch` directive can return a function. If it does, the returned function is used as cleanup logic, i.e., it will run just before the callback runs again, and it will run again when the element is removed from the DOM.

As a reference, some use cases for this directive may be:

- Logging.
- Changing the title of the page.
- Setting the focus on an element with `.focus()`.
- Changing the state or context when certain conditions are met.

#### `wp-init` 

It runs a callback **only when the node is created**.

You can attach several `wp-init` to the same DOM element by using the syntax `data-wp-init--[unique-id]`. _The unique id doesn't need to be unique globally, it just needs to be different than the other unique ids of the `wp-init` directives of that DOM element._

_Example of `data-wp-init` directive_ 

```html
<div data-wp-init="callbacks.logTimeInit">
  <p>Hi!</>
</div>
```

_Example of several `wp-init` directives on the same DOM element_

```html
<form 
  data-wp-init--log="callbacks.logTimeInit" 
  data-wp-init--focus="callbacks.focusFirstElement"
>
  <input type="text">
</form>
```

<details>
  <summary><em>See store used with the directive above</em></summary>

```js
store( "myPlugin", {
  callbacks: {
    logTimeInit: () => console.log( `Init at ` + new Date() ),
    focusFirstElement: () => {
      const { ref } = getElement();
      ref.querySelector( 'input:first-child' ).focus(),
    },
  },
} );
```

</details>
<br/>

The `wp-init` can return a function. If it does, the returned function will run when the element is removed from the DOM.

#### `wp-run` 

It runs the passed callback **during node's render execution**.

You can use and compose hooks like `useState`, `useWatch` or `useEffect` inside inside the passed callback and create your own logic, providing more flexibility than previous directives.

You can attach several `wp-run` to the same DOM element by using the syntax `data-wp-run--[unique-id]`. _The unique id doesn't need to be unique globally, it just needs to be different than the other unique ids of the `wp-run` directives of that DOM element._

_Example of `data-wp-run` directive_ 

```html
<div data-wp-run="callbacks.logInView">
  <p>Hi!</p>
</div>
```

<details>
  <summary><em>See store used with the directive above</em></summary>

```js
import { store, useState, useEffect } from '@wordpress/interactivity';

// Unlike `data-wp-init` and `data-wp-watch`, you can use any hooks inside
// `data-wp-run` callbacks.
const useInView = ( ref ) => {
  const [ inView, setInView ] = useState( false );
  useEffect( () => {
    const observer = new IntersectionObserver( ( [ entry ] ) => {
      setInView( entry.isIntersecting );
    } );
    if ( ref ) observer.observe( ref );
    return () => ref && observer.unobserve( ref );
  }, []);
  return inView;
};

store( 'myPlugin', {
  callbacks: {
    logInView: () => {
      const { ref } = getElement();
      const isInView = useInView( ref );
      useEffect( () => {
        if ( isInView ) {
          console.log( 'Inside' );
        } else {
          console.log( 'Outside' );
        }
      });
    }
  },
} );
```

</details>
<br/>

#### `wp-key` 

The `wp-key` directive assigns a unique key to an element to help the Interactivity API identify it when iterating through arrays of elements. This becomes important if your array elements can move (e.g., due to sorting), get inserted, or get deleted. A well-chosen key value helps the Interactivity API infer what exactly has changed in the array, allowing it to make the correct updates to the DOM.

The key should be a string that uniquely identifies the element among its siblings. Typically, it is used on repeated elements like list items. For example:

```html
<ul>
  <li data-wp-key="unique-id-1">Item 1</li> 
  <li data-wp-key="unique-id-2">Item 2</li>
</ul>  
```

But it can also be used on other elements:

```html
<div>
  <a data-wp-key="previous-page" ...>Previous page</a> 
  <a data-wp-key="next-page" ...>Next page</a>
</div>  
```

When the list is re-rendered, the Interactivity API will match elements by their keys to determine if an item was added/removed/reordered. Elements without keys might be recreated unnecessarily.

### Values of directives are references to store properties

The value assigned to a directive is a string pointing to a specific state, action, or side effect.

In the following example, we use a getter to define the `state.isPlaying` derived value.

```js
const { state } = store( "myPlugin", {
  state: {
    currentVideo: '',
    get isPlaying() {
      return state.currentVideo !== '';
    } 
  },
} );
```

And then, we use the string value `"state.isPlaying"` to assign the result of this selector to `data-bind--hidden`.

```html
<div data-bind--hidden="!state.isPlaying" ... >
  <iframe ...></iframe>
</div>
```

These values assigned to directives are **references** to a particular property in the store. They are wired to the directives automatically so that each directive “knows” what store element refers to, without any additional configuration.

Note that, by default, references point to properties in the current namespace, which is the one specified by the closest ancestor with a `data-wp-interactive` attribute. If you need to access a property from a different namespace, you can explicitly set the namespace where the property we want to access is defined. The syntax is `namespace::reference`, replacing `namespace` with the appropriate value.

In the example below, we get `state.isPlaying` from `otherPlugin` instead of `myPlugin`:

```html
<div data-wp-interactive='{ "namespace": "myPlugin" }'>
  <div data-bind--hidden="otherPlugin::!state.isPlaying" ... >
		<iframe ...></iframe>
	</div>
</div>
```

## The store

The store is used to create the logic (actions, side effects…) linked to the directives and the data used inside that logic (state, derived state…).

**The store is usually created in the `view.js` file of each block**, although the state can be initialized from the `render.php` of the block.

### Elements of the store

#### State 

It defines data available to the HTML nodes of the page. It is important to differentiate between two ways to define the data:

- **Global state**:  It is defined using the `store()` function with the `state` property, and the data is available to all the HTML nodes of the page.
- **Context/Local State**: It is defined using the `data-wp-context` directive in an HTML node, and the data is available to that HTML node and its children. It can be accessed using the `getContext` function inside of an action, derived state or side effect.
  
```html
<div data-wp-context='{ "someText": "Hello World!" }'>

  <!-- Access global state -->
  <span data-wp-text="state.someText"></span>

  <!-- Access local state (context) -->
  <span data-wp-text="context.someText"></span>

</div>
```

```js
const { state } = store( "myPlugin", {
  state: {
    someText: "Hello Universe!"
  },
  actions: {
    someAction: () => {
      state.someText // Access or modify global state - "Hello Universe!"

      const context = getContext();
      context.someText // Access or modify local state (context) - "Hello World!"
    },
  },
} )
```

#### Actions 

Usually triggered by the `data-wp-on` directive (using event listeners) or other actions.

#### Side Effects 

Automatically react to state changes. Usually triggered by `data-wp-watch` or `data-wp-init` directives.

#### Derived state

They return a computed version of the state. They can access both `state` and `context`.

```js
// view.js  
const { state } = store( "myPlugin", {
  state: {
    amount: 34,
    defaultCurrency: 'EUR',
    currencyExchange: {
      USD: 1.1,
      GBP: 0.85,
    },
    get amountInUSD() {
      return state.currencyExchange[ 'USD' ] * state.amount,
    },
    get amountInGBP() {
      return state.currencyExchange[ 'GBP' ] * state.amount,
    },
  },
} );
```

### Accessing data in callbacks


The **`store`** contains all the store properties, like `state`, `actions` or `callbacks`. They are returned by the `store()` call, so you can access them by destructuring it:

```js
const { state, actions } = store( "myPlugin", {
  // ...
} );
```

The `store()` function can be called multiple times and all the store parts will be merged together:

```js
store( "myPlugin", {
  state: {
    someValue: 1,
  }
} );

const { state } = store( "myPlugin", {
  actions: {
    someAction() {
      state.someValue // = 1
    }
  }
} );
```

> **Note**
> All `store()` calls with the same namespace return the same references, i.e., the same `state`, `actions`, etc., containing the result of merging all the store parts passed.

- To access the context inside an action, derived state, or side effect, you can use the `getContext` function. 
- To access the reference, you can use the `getElement` function.

```js
const { state } = store( "myPlugin", {
  state: {
    get someDerivedValue() {
      const context = getContext();
      const { ref } = getElement();
      // ...
    }
  },
  actions: {
    someAction() {
      const context = getContext();
      const { ref } = getElement();
      // ...
    }
  },
  callbacks: {
    someEffect() {
      const context = getContext();
      const { ref } = getElement();
      // ...
    }
  }
} );
```

This approach enables some functionalities that make directives flexible and powerful:

- Actions and side effects can read and modify the state and the context.
- Actions and state in blocks can be accessed by other blocks.
- Actions and side effects can do anything a regular JavaScript function can do, like access the DOM or make API requests.
- Side effects automatically react to state changes.

### Setting the store

#### On the client side

*In the `view.js` file of each block* we can define both the state and the elements of the store referencing functions like actions, side effects or derived state.

The `store` method used to set the store in javascript can be imported from `@wordpress/interactivity`.  

```js
// store
import { store, getContext } from '@wordpress/interactivity';

store( "myPlugin", {
  actions: {
    toggle: () => {
      const context = getContext();
      context.isOpen = !context.isOpen;
    },
  },
  callbacks: {
    logIsOpen: () => {
      const { isOpen } = getContext();
      // Log the value of `isOpen` each time it changes.
      console.log( `Is open: ${ isOpen }` );
    }
  },
});
```

#### On the server side

> **Note**
> We will rename `wp_store` to `wp_initial_state` in a future version.

The state can also be initialized on the server using the `wp_store()` function. You would typically do this in the `render.php` file of your block (the `render.php` templates were [introduced](https://make.wordpress.org/core/2022/10/12/block-api-changes-in-wordpress-6-1/) in WordPress 6.1). 

The state defined on the server with `wp_store()` gets merged with the stores defined in the view.js files.

The `wp_store` function receives an [associative array](https://www.php.net/manual/en/language.types.array.php) as a parameter. 

_Example of store initialized from the server with a `state` = `{ someValue: 123 }`_

```php
// render.php
wp_store( array(
  'myPlugin' => array(
    'someValue' = 123
  )
);
```

Initializing the state in the server also allows you to use any WordPress API. For example, you could use the Core Translation API to translate part of your state:

```php
// render.php
wp_store(
  array(
    "favoriteMovies" => array(
      "1" => array(
        "id" => "123-abc",
        "movieName" => __("someMovieName", "textdomain")
      ),
    ),
  )
);
```

### Private stores

A given store namespace can be marked as private, thus preventing its content to be accessed from other namespaces. The mechanism to do so is by adding a `lock` option to the `store()` call, like shown in the example below. This way, further executions of `store()` with the same locked namespace will throw an error, meaning that the namespace can only be accessed where its reference was returned from the first `store()` call. This is specially useful for developers that want to hide part of their plugin stores so it doesn't become accessible for extenders.

```js
const { state } = store(
	"myPlugin/private",
	{ state: { messages: [ "private message" ] } },
	{ lock: true }
);

// The following call throws an Error!
store( "myPlugin/private", { /* store part */ } );
```

There is also a way to unlock private stores: instead of passing a boolean, you can use a string as the `lock` value. Such a string can then be used in subsequent `store()` calls to the same namespace to unlock its content. Only the code knowing the string lock will be able to unlock the protected store namespaced. This is useful for complex stores defined in multiple JS modules.

```js
const { state } = store(
	"myPlugin/private",
	{ state: { messages: [ "private message" ] } },
	{ lock: PRIVATE_LOCK }
);

// The following call works as expected.
store( "myPlugin/private", { /* store part */ }, { lock: PRIVATE_LOCK } );
```
