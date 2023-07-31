# API Reference

To add interactivity to blocks using the Interactivity API, developers can use:

- **Directives** - added to the markup to add specific behavior to the DOM elements of block.
- **Store** - that contains the logic and data (state, actions, or effects among others) needed for the behaviour.

Directives are connected to data stored in the state & context. If data in the state or context change, directives will react to those changes updating the DOM accordingly  (see [diagram](https://excalidraw.com/#room=11c461f5e18480cd8631,mNsrOHbcUKgVdITiRl6H5w)).

![State & Directives](assets/state-directives.png)

## The directives

Directives are custom attributes that are added to the markup of your block to add behaviour to its DOM elements. This can be done in the `render.php` file (for dynamic blocks) or the `save.js` file (for static blocks).

Interactivity API directives use the `data-` prefix.

_Example of directives used in the HTML markup_

```html
<div
  data-wp-context='{ "isOpen": false }'
  data-wp-effect="effects.logIsOpen"
>
  <button
    data-wp-on--click="actions.toggle"
    data-wp-bind--aria-expanded="context.isOpen"
    aria-controls="p-1"
  >
    Toggle
  </button>
 
  <p id="p-1" data-wp-show="context.isOpen">
    This element is now visible!
  </p>
</div>
```

### List of Directives

With directives we can manage directly in the DOM behavior related to things such as: Side Effects, State, Event Handlers, Attributes, Display, Template Logic, Content or Errors

#### `wp-effect` ![](https://img.shields.io/badge/SIDE_EFFECTS-207399.svg)

It runs an expression **when the node is created and runs it again when the state or context changes**. You can call several effects (or inits) from the same DOM by using the syntax`data-effect--[unique-id]`

_Example of `wp-effect` directive_
```html
<form 
  data-wp-effect="effect.myNamespace.logTime" 
>
  <input type="text" id="password" name="access-password">
</form>
```

_Example of several `wp-effect` directives on the same DOM element_
```html
<form 
  data-wp-effect–-1="effect.myNamespace.logTime" 
  data-wp-effect–-2="effect.myNamespace.focusFirstElement"
>
  <input type="text" id="password" name="access-password">
</form>
```

<details>
  <summary><em>See store used with the directive above</em></summary>
<pre><code>
// store
store({
  effects: {
    myNamespace: {
      logTime: () => console.log(new Date()),
      focusFirstElement: ({ref}) => ref.querySelector('input:first-child').focus();
    },
  }
});
</code></pre>
</details>
<br/>

Typical use cases for this directive are: showing a console.log, change the title of the page or usability behaviours using `.ref()` `.focus()`

#### `wp-init` ![](https://img.shields.io/badge/SIDE_EFFECTS-207399.svg)

Like `wp-effect` but it runs an expression **only when the node is created**.

_Example of `data-wp-init` directive_ 
```html
<div data-wp-init="effect.myNamespace.logTimeInit">
  <p>Hi!</>
</div>
```

<details>
  <summary><em>See store used with the directive above</em></summary>
<pre><code>
// store
store({
  effects: {
    myNamespace: {
      logTimeInit: () => console.log( `Init at `+ new Date()),
    },
  }
});
</code></pre>
</details>
<br/>

#### `wp-on` ![](https://img.shields.io/badge/EVENT_HANDLERS-207399.svg)

It runs code on dispatched DOM events like `click` or `keyup`. The format of this directive is `data-wp-on--[event]`, like `data-wp-on--click` or `data-wp-on--keyup`.

_Example of `wp-context` directive_ 
```php
<button data-wp-on--click="actions.myNamespace logTime" >
  Click Me!
</button>
```

<details>
  <summary><em>See store used with the directive above</em></summary>
<pre><code>
// store
store({
  actions: {
    myNamespace: {
      logTime: () => console.log(new Date())
    },
  },
});
</code></pre>
</details>
<br/>

#### `wp-context` ![](https://img.shields.io/badge/STATE-207399.svg)

It provides **local** state available to a specific HTML node and its children.

_Example of `wp-context` directive_ 
```php
//render.php
<div data-wp-context='{ "post": { "id": <?php echo $post->ID; ?> } }' >
  <button data-wp-on--click="actions.myNamespace.logId" >
    Click Me!
  </button>
</div>
>
```

<details>
  <summary><em>See store used with the directive above</em></summary>
<pre><code>
// store
store({
  actions: {
    myNamespace: {
      logId: ({ context }) => {
        console.log(context.post.id);
      },
    },
  },
});
</code></pre>
</details>
<br/>

#### `wp-class` ![](https://img.shields.io/badge/ATTRIBUTES-207399.svg)

It adds or removes a class to an HTML element, depending on a boolean value.

_Example of `wp-class` directive_ 
```php
<div data-wp-context='{ "hidden": true }' >
  <button data-wp-on--click="actions.myNamespace.toggleTextVisibility" >Show Text</button>
  <p data-wp-class--hidden="selectors.myNamespace.isTextHidden">Hello World!</p>
</div>
>
```

<details>
  <summary><em>See store used with the directive above</em></summary>
<pre><code>
// store
store({
  actions: {
    myNamespace: {
      toggleTextVisibility: ({ context }) => !context.hidden ,
    },
  },
  selectors: {
    myNamespace: {
      isTextHidden: ({ context }) => context.hidden ,
    },
  },
});
</code></pre>
</details>
<br/>

#### `wp-style` ![](https://img.shields.io/badge/ATTRIBUTES-207399.svg)

It adds or removes inline style to an HTML element, depending on its value.

_Example of `wp-style` directive_ 
```html
<div data-wp-context='{ "color": "red" }' >
  <button data-wp-on--click="actions.myNamespace.toggleContextColor">Toggle Color Text</button>
  <p data-wp-style--color="context.color"">Hello World!</p>
</div>
>
```

<details>
  <summary><em>See store used with the directive above</em></summary>
<pre><code>
// store
store({
  actions: {
    myNamespace: {
      toggleContextColor: ( { context } ) => {
        context.color = context.color === "red" ? "blue" : "red";
      }
    },
  }
});
</code></pre>
</details>
<br/>

#### `wp-show` ![](https://img.shields.io/badge/DISPLAY-207399.svg)

It shows and hides elements depending on the state or context.

```html
<li
  data-wp-context='{"isMenuOpen": false }'>
  <button
    data-wp-on.click="actions.myNamespace.toggleMenu"
  >
  </button>
  <div data-wp-show="context.isMenuOpen">
    <span>Title</span>
    <ul>
      SUBMENU ITEMS
    </ul>
  </div>
</li>
```

<details>
  <summary><em>See store used with the directive above</em></summary>
<pre><code>
// store
store({
  actions: {
    myNamespace: {
      toggleMenu: ( { context } ) => !context.isMenuOpen
    },
  }
});
</code></pre>
</details>
<br/>

#### `wp-bind` ![](https://img.shields.io/badge/ATTRIBUTES-207399.svg)

It allows setting HTML attributes on elements based on a boolean value.

```html
<li
  data-wp-context='{"isMenuOpen": false }'>
  <button
    data-wp-on.click="actions.myNamespace.toggleMenu"
    data-wp-bind.aria-expanded="context.isMenuOpen"
  >
  </button>
  <div data-wp-show="context.isMenuOpen">
    <span>Title</span>
    <ul>
      SUBMENU ITEMS
    </ul>
  </div>
</li>
```

<details>
  <summary><em>See store used with the directive above</em></summary>
<pre><code>
// store
store({
  actions: {
    myNamespace: {
      toggleMenu: ( { context } ) => !context.isMenuOpen
    },
  }
});
</code></pre>
</details>
<br/>


#### `wp-each` ![](https://img.shields.io/badge/TEMPLATE_LOGIC-207399.svg)

It creates DOM elements by iterating through a list.

#### `wp-slot / wp-fill` ![](https://img.shields.io/badge/TEMPLATE_LOGIC-207399.svg)

It moves snippets of HTML from one place (fills) to another (slots).

#### `wp-text` ![](https://img.shields.io/badge/CONTENT-207399.svg)

It sets the inner content of an HTML element.

```html
<div data-wp-context='{ "text": "Text 1" }'>
  <span
    data-wp-text="context.text"
  ></span>
  <button
    data-wp-on--click="actions.toggleContextText"
  >
    Toggle Context Text
  </button>
</div>
```

<details>
  <summary><em>See store used with the directive above</em></summary>
<pre><code>
// store
store({
  actions: {
    myNamespace: {
      toggleContextText: ( { context } ) => {
        context.text = context.text === 'Text 1' ? 'Text 2' : 'Text 1';
      },
    },
  }
});
</code></pre>
</details>
<br/>

#### `wp-html` ![](https://img.shields.io/badge/CONTENT-207399.svg)

It sets the innerHTML property of an HTML element.

#### `wp-error` ![](https://img.shields.io/badge/ERROR-207399.svg)

It captures errors in other interactive blocks.


### Values of directives are references to properties

The value assigned to a directive is a string pointing to a specific state, selector, action, or effect. *Using a Namespace is highly recommended* to define these elements of the store. 

In the following example we use the namespace `wpmovies` (plugin name is usually a good namespace name) to define the `isPlaying` selector
```js
store({
  selectors: {
    wpmovies: {
      isPlaying: ({ state }) => state.wpmovies.currentVideo !== '',
    },
  }
});
```

And then, we use the string value `"selectors.wpmovies.isPlaying"` to assign the result of this selector to the `data-wp-show`

```php
<div data-wp-show="selectors.wpmovies.isPlaying" ... >
  <iframe ...></iframe>
</div>
```

These values assigned to directives are **references** to a particular property in the store. They are wired to the directives automatically so that each directive “knows” what store element (action, effect...) refers to without any additional configuration.


## The store

The store is used to create the logic (actions and effects) called by the directives and the data used this logic.

**The store is usually created in the `view.js` file of each block**, although it can be initialized from the `render.php` of the block (see [diagram](https://excalidraw.com/#room=11c461f5e18480cd8631,mNsrOHbcUKgVdITiRl6H5w))

The store contains the reactive state and the actions and effects that modify it.

### Elements of the store

#### State 

Defines data available to the HTML nodes of the page. It is important to differentiate between two ways to define the data:
  - **Global state**:  It is defined using the `store()` function, and the data is available to all the HTML nodes of the page.
  - **Context/Local State**: It is defined using the `data-wp-context` directive in an HTML node, and the data is available to that HTML node and its children.

#### Actions 

Usually triggered by the `data-wp-on` directive (using event listeners) or other actions.

#### Effects 

Automatically react to state changes. Usually triggered by `data-wp-effect` or `data-wp-init` directives.

#### Selectors

Also known as _derived state_, returns a computed version of the state.

```js
// view.js
import { store } from "@wordpress/interactivity"
  
store({
    state: {
        amount: 34,
        defaultCurrency: "EUR",
        currencyExchange: {
          "USD": 1.10,
          "GBP": 0.85
        }
    },
    selectors: {
        amountInUSD : ( { state } ) => state.currencyExchange["USD"] * state.amount,
        amountInGBP : ( { state } ) => state.currencyExchange["GBP"] * state.amount
    }
})
```

### Objects passed to directive callbacks

When a directive is evaluated, the reference callback receives an object with:

- The **`store`** containing the `state`, `actions` and `effects`.
- The **context** (an object containing the context defined in all the `wp-context` ancestors).
- The reference to the DOM element on which the directive was defined (a `ref`).
- Other properties relevant to the directive. For example, the `data-wp-on--click` directive also receives the instance of the [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) triggered by the user.

_Example of action making use of all values received when it's triggered_
```js
// view.js
import { store } from "@wordpress/interactivity"
  
store({
    state: {
        theme: false,
    },
    actions: {
        toggle: ({
            state,
            context,
            ref,
            event,
            className,
        }) => {
            console.log(state);
            // `{ "theme": false }`
            console.log(context);
            // `{ "isOpen": true }`
            console.log(ref);
            // The DOM element
            console.log(event);
            // The Event object if using the `data-wp-on`
            console.log(className);
            // The class name if using the `data-wp-class`
        }
    }
})
```

This approach enables some functionalities that make directives flexible and powerful:

- Actions and effects can read and modify the state and the context.
- Actions and state in blocks can be accessed by other blocks:
- Actions and effects can do anything a regular JavaScript function can do, like access the DOM or make API requests.
- Effects automatically react to state changes.

### Setting the store

#### On the client side

*In the `view.js` file of each block* we can define both the state and the elements of the store referencing functions like actions, effects or selectors.

`store` method used to set the store in javascript can be imported from `@wordpress/interactivity`  

```js
// store
import { store } from "@wordpress/interactivity"

store({
  state: {
    isVisible: false,
  }
  actions: {
    myNamespace: {
      toggleVisibility: ({ state }) => !state.isVisible ,
    },
  },
  selectors: {
    myNamespace: {
      isHidden: ({ state }) => state.isVisible === false,
    },
  },
});
```

#### On the server side

The store can also be initialized on the server using the `wp_store()` function. You would typically do this in the `render.php` file of your block (the `render.php` templates were [introduced](https://make.wordpress.org/core/2022/10/12/block-api-changes-in-wordpress-6-1/) in WordPress 6.1). 

The store defined on the server with `wp_store()` gets merged with the stores defined in the view.js files.

The `wp_store` function receives an [associative array](https://www.php.net/manual/en/language.types.array.php) as a parameter. 


_Example of store initialized from the server with a `state` = `{ someValue: 123 }`_

```php
// render.php
wp_store( array(
  'state' => array(
    'myPlugin' => array(
      'someValue' = 123
    )
  )
);
```

Initializing the store in the server also allows you to use any WordPress API. For example, you could use the Core Translation API to translate part of your state:

```php
// render.php
wp_store(
  array(
    "state" => array(
      "favoriteMovies" => array(
        "1" => array(
          "id" => "123-abc",
          "movieName" => __("someMovieName", "textdomain")
        ),
      ),
    ),
  )
);
```



