# API Reference

To add interactivity to blocks using the Interactivity API, developers can use:

- **Directives** - added to the markup to add specific behavior to the DOM elements of block.
- **Store** - that contains the logic and data (state, actions, or effects) needed for the behaviour.

## The directives

Directives are custom attributes that are added to the markup of your block to add behaviour to its DOM elements. This can be done in the `render.php` file (for dynamic blocks) or the `save.js` file (for static blocks).

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

#### Values of directives are references to properties

The value assigned to a directive is a string pointing to a specific state, selector, action, or effect. *Using a Namespace is highly recommended* to define these elements.


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

So then we use the string value `"selectors.wpmovies.isPlaying"` to assign the result of this selector to the `data-wp-show`

```php
<div data-wp-show="selectors.wpmovies.isPlaying" ... >
	<iframe ...></iframe>
</div>
```

These values assigned to directives are **references** to a particular property in the store. They are wired to the directives automatically so that each directive “knows” what `actions.toggle` refers to without any additional configuration.

#### Objects passed to directive callbacks

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


#### List of Directives

Side Effects
- `wp-effect` runs an expression when the node is created and runs it again when the state or context changes.
- `wp-init` runs an expression only when the node is created.

State
- `wp-context` - provides **local** state available to a specific HTML node and its children.

Event Handlers
- `wp-on` - runs code on dispatched DOM events like `click` or `keyup`. The format of this directive is `data-wp-on--[event]`, like `data-wp-on--click` or `data-wp-on--keyup`.

Attributes
- `wp-class` adds or removes a class to an HTML element, depending on its value.
- `wp-style` adds or removes inline style to an HTML element, depending on its value.
- `wp-bind` allows setting HTML attributes on elements.


Display
- `wp-show` shows and hides elements depending on the state or context.

Template Logic
- `wp-each` creates DOM elements by iterating through a list.
- `wp-slot / wp-fill` moves snippets of HTML from one place (fills) to another (slots).


Content
- `wp-text` sets the inner content of an HTML element.
- `wp-html` sets the innerHTML property of an HTML element.

Errors
- `wp-error` captures errors in other interactive blocks.


## The store

The store is used to create the logic (actions and effects) called by the directives and the data used this logic.

The store is created in the view.js file of each block.

The store contains the reactive state and the actions and effects that modify it.

- **State**: Defines data available to the HTML nodes of the page. It is important to differentiate between two ways to define the data:
  - **Global state**:  It is defined using the store() function, and the data is available to all the HTML nodes of the page.
  - **Context/Local State**: It is defined using the data-wp-context directive in an HTML node, and the data is available to that HTML node and its children.
- **Actions**: Usually triggered by the data-wp-on directive (using event listeners) or other actions.
- **Effects**: Automatically react to state changes. Usually triggered by data-wp-effect or data-wp-init directives.


### On the PHP side

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

### On the JS side

```js
store({
	state: {
		myPlugin: {
			someValue: 123
		}
	}
});
```

