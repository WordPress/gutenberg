# Understanding global state, local context and derived state

The Interactivity API offers a powerful framework for creating interactive blocks. To make the most of its capabilities, it's crucial to understand when to use global state, local context, or derived state. This guide will clarify these concepts and provide practical examples to help you decide when to use each one.

Let's start with a brief definition of global state, local context and derived state.

-   **Global state:** Global data that can be accessed and modified by any interactive block on the page, allowing different parts of your interactive blocks to stay in sync.
-   **Local context:** Local data defined within a specific element in the HTML structure, accessible only to that element and its children, providing independent state for individual blocks.
-   **Derived state:** Computed values based on global state or local context, dynamically calculated on-demand to ensure consistent data representation without storing redundant data.

Let's now dive into each of these concepts to study them in more detail and provide some examples.

## Global state

**Global state** in the Interactivity API refers to global data that can be accessed and modified by any interactive block on the page. It serves as a shared information hub, allowing different parts of your blocks to communicate and stay in sync. Global state is the ideal mechanism for exchanging information between interactive blocks, regardless of their position in the DOM tree.

You should use global state when:

-   You need to share data between multiple interactive blocks that are not directly related in the DOM hierarchy.
-   You want to maintain a single source of truth for certain data across all your interactive blocks.
-   You're dealing with data that affects multiple parts of your UI simultaneously.
-   You want to implement features that are global for the page.

### Working with global state

-   **Initializing the global state**

    Typically, the initial global state values should be defined on the server using the `wp_interactivity_state` function:

    ```php
    // Populates the initial global state values.
    wp_interactivity_state( 'myPlugin', array(
      'isDarkTheme' => true,
      'show'        => false,
      'helloText'   => __( 'world' ),
    ));
    ```

    These initial global state values will be used during the rendering of the page in PHP to populate the HTML markup that is sent to the browser.

    -   HTML markup written in the PHP file by the developer:

        ```html
        <div
        	data-wp-interactive="myPlugin"
        	data-wp-class--is-dark-theme="state.isDarkTheme"
        	class="my-plugin"
        >
        	<div data-wp-bind--hidden="!state.show">
        		Hello <span data-wp-text="state.helloText"></span>
        	</div>
        	<button data-wp-on-async--click="actions.toggle">Toggle</button>
        </div>
        ```

    -   HTML markup after the directives have been processed and it is ready to be sent to the browser:

        ```html
        <div
        	data-wp-interactive="myPlugin"
        	data-wp-class--is-dark-theme="state.isDarkTheme"
        	class="my-plugin is-dark-theme"
        >
        	<div hidden data-wp-bind--hidden="!state.show">
        		Hello <span data-wp-text="state.helloText">world</span>
        	</div>
        	<button data-wp-on-async--click="actions.toggle">Toggle</button>
        </div>
        ```

    _Please, visit [the Server-side Rendering guide](/docs/reference-guides/interactivity-api/core-concepts/server-side-rendering.md) to learn more about how directives are processed on the server._

    In cases where the global state is not used during the rendering of the page in PHP, it can also be defined directly on the client.

    ```js
    const { state } = store( 'myPlugin', {
    	state: {
    		isLoading: false,
    	},
    	actions: {
    		*loadSomething() {
    			state.isLoading = true;
    			// ...
    		},
    	},
    } );
    ```

    _Please note that, although this works, in general it is a good practice to define all the global state on the server._

-   **Accessing the global state**

    In the HTML markup, you can access the global state values directly by referencing `state` in the directive attribute values:

    ```html
    <div data-wp-bind--hidden="!state.show">
    	<span data-wp-text="state.helloText"></span>
    </div>
    ```

    In JavaScript, the `store` function from the package at `@wordpress/interactivity` works both as a setter and a getter, returning the store of the selected namespace.

    To access the global state in your actions and callbacks, you can use the `state` property of the object returned by the `store` function:

    ```js
    const myPluginStore = store( 'myPlugin' );

    myPluginStore.state; // This is the state of the 'myPlugin' namespace.
    ```

    You can also destructure the object returned by `store`:

    ```js
    const { state } = store( 'myPlugin' );
    ```

    And you can do the same even if you are defining the store at that moment, which is the most common scenario:

    ```js
    const { state } = store( 'myPlugin', {
    	state: {
    		// ...
    	},
    	actions: {
    		toggle() {
    			state.show = ! state.show;
    		},
    	},
    } );
    ```

    The global state initialized on the server using the `wp_interactivity_state` function is also included in that object because it is automatically serialized from the server to the client:

    ```php
    wp_interactivity_state( 'myPlugin', array(
      'someValue' => 1,
    ));
    ```

    ```js
    const { state } = store( 'myPlugin', {
    	state: {
    		otherValue: 2,
    	},
    	actions: {
    		readGlobalState() {
    			state.someValue; // It exists and its initial value is 1.
    			state.otherValue; // It exists and its initial value is 2.
    		},
    	},
    } );
    ```

    Lastly, all calls to the `store` function with the same namespace are merged together:

    ```js
    store( 'myPlugin', { state: { someValue: 1 } } );

    store( 'myPlugin', { state: { otherValue: 2 } } );

    /* All calls to `store` return a stable reference to the same object, so you
     * can get a reference to `state` from any of them. */
    const { state } = store( 'myPlugin' );

    store( 'myPlugin', {
    	actions: {
    		readValues() {
    			state.someValue; // It exists and its initial value is 1.
    			state.otherValue; // It exists and its initial value is 2.
    		},
    	},
    } );
    ```

-   **Updating the global state**

    To update the global state, all you need to do is mutate the `state` object once you have obtained it from the `store` function:

    ```js
    const { state } = store( 'myPlugin', {
    	actions: {
    		updateValues() {
    			state.someValue = 3;
    			state.otherValue = 4;
    		},
    	},
    } );
    ```

    Changes to the global state will automatically trigger updates in any directives that depend on the modified values.

    _Please, visit [The Reactive and Declarative mindset](/docs/reference-guides/interactivity-api/core-concepts/the-reactive-and-declarative-mindset.md) guide to learn more about how reactivity works in the Interactivity API._

### Example: Two interactive blocks using global state to communicate

In this example, there are two independent interactive blocks. One displays a counter, and the other a button to increment that counter. These blocks can be positioned anywhere on the page, regardless of the HTML structure. In other words, one does not need to be an inner block of the other.

-   **Counter Block**

    ```php
    <?php
    wp_interactivity_state( 'myCounterPlugin', array(
      'counter' => 0
    ));
    ?>

    <div
      data-wp-interactive="myCounterPlugin"
      <?php echo get_block_wrapper_attributes(); ?>
    >
      Counter: <span data-wp-text="state.counter"></span>
    </div>
    ```

-   **Increment Block**

    ```php
    <div
      data-wp-interactive="myCounterPlugin"
      <?php echo get_block_wrapper_attributes(); ?>
    >
      <button data-wp-on-async--click="actions.increment">
        Increment
      </button>
    </div>
    ```

    ```js
    const { state } = store( 'myCounterPlugin', {
    	actions: {
    		increment() {
    			state.counter += 1;
    		},
    	},
    } );
    ```

In this example:

1. The global state is initialized on the server using `wp_interactivity_state`, setting an initial `counter` of 0.
2. The Counter Block displays the current counter using `data-wp-text="state.counter"`, which reads from the global state.
3. The Increment Block contains a button that triggers the `increment` action when clicked, using `data-wp-on-async--click="actions.increment"`.
4. In JavaScript, the `increment` action directly modifies the global state by incrementing `state.counter`.

Both blocks are independent and can be placed anywhere on the page. They don't need to be nested or directly related in the DOM structure. Multiple instances of these interactive blocks can be added to the page, and they will all share and update the same global counter value.

## Local context

**Local context** in the Interactivity API refers to local data defined within a specific element in the HTML structure. Unlike global state, local context is only accessible to the element where it's defined and its child elements.

The local context is particularly useful when you need independent state for individual interactive blocks, ensuring that each instance of a block can maintain its own unique data without interfering with others.

You should use local context when:

-   You need to maintain separate state for multiple instances of the same interactive block.
-   You want to encapsulate data that's only relevant to a specific interactive block and its children.
-   You need to implement features that are isolated to a specific part of your UI.

### Working with local context

-   **Initializing the local context**

    The local context is initialized directly within the HTML structure using the `data-wp-context` directive. This directive accepts a JSON string that defines the initial values for that piece of context.

    ```html
    <div data-wp-context='{ "counter": 0 }'>
    	<!-- Child elements will have access to `context.counter` -->
    </div>
    ```

    You can also initialize the local context on the server using the `wp_interactivity_data_wp_context` PHP helper, which ensures proper escaping and formatting of the stringified values:

    ```php
    <?php
    $context = array( 'counter' => 0 );
    ?>

    <div <?php echo wp_interactivity_data_wp_context( $context ); ?>>
      <!-- Child elements will have access to `context.counter` -->
    </div>
    ```

-   **Accessing the local context**

    In the HTML markup, you can access the local context values directly by referencing `context` in the directive values:

    ```html
    <div data-wp-bind--hidden="!context.isOpen">
    	<span data-wp-text="context.counter"></span>
    </div>
    ```

    In JavaScript, you can access the local context values using the `getContext` function:

    ```js
    store( 'myPlugin', {
    	actions: {
    		sendAnalyticsEvent() {
    			const { counter } = getContext();
    			myAnalyticsLibrary.sendEvent( 'updated counter', counter );
    		},
    	},
    	callbacks: {
    		logCounter() {
    			const { counter } = getContext();
    			console.log( `Current counter: ${ counter }` );
    		},
    	},
    } );
    ```

    The `getContext` function returns the local context of the element that triggered the action/callback execution.

-   **Updating the local context**

    To update the local context values in JavaScript, you can modify the object returned by `getContext`:

    ```js
    store( 'myPlugin', {
    	actions: {
    		increment() {
    			const context = getContext();
    			context.counter += 1;
    		},
    		updateName( event ) {
    			const context = getContext();
    			context.name = event.target.value;
    		},
    	},
    } );
    ```

    Changes to the local context will automatically trigger updates in any directives that depend on the modified values.

    _Please, visit [The Reactive and Declarative mindset](/docs/reference-guides/interactivity-api/core-concepts/the-reactive-and-declarative-mindset.md) guide to learn more about how reactivity works in the Interactivity API._

-   **Nesting local contexts**

    Local contexts can be nested, with child contexts inheriting and potentially overriding values from parent contexts:

    ```html
    <div data-wp-context='{ "theme": "light", "counter": 0 }'>
    	<p>Theme: <span data-wp-text="context.theme"></span></p>
    	<p>Counter: <span data-wp-text="context.counter"></span></p>

    	<div data-wp-context='{ "theme": "dark" }'>
    		<p>Theme: <span data-wp-text="context.theme"></span></p>
    		<p>Counter: <span data-wp-text="context.counter"></span></p>
    	</div>
    </div>
    ```

    In this example, the inner `div` will have a `theme` value of `"dark"`, but will inherit the `counter` value `0` from its parent context.

### Example: One interactive block using local context to have independent state

In this example, there is a single interactive block that shows a counter and can increment it. By using local context, each instance of this block will have its own independent counter, even if multiple blocks are added to the page.

```php
<div
  data-wp-interactive="myCounterPlugin"
  <?php echo get_block_wrapper_attributes(); ?>
  data-wp-context='{ "counter": 0 }'
>
  <p>Counter: <span data-wp-text="context.counter"></span></p>
  <button data-wp-on-async--click="actions.increment">Increment</button>
</div>
```

```js
store( 'myCounterPlugin', {
	actions: {
		increment() {
			const context = getContext();
			context.counter += 1;
		},
	},
} );
```

In this example:

1. A local context with an initial `counter` value of `0` is defined using the `data-wp-context` directive.
2. The counter is displayed using `data-wp-text="context.counter"`, which reads from the local context.
3. The increment button uses `data-wp-on-async--click="actions.increment"` to trigger the increment action.
4. In JavaScript, the `getContext` function is used to access and modify the local context for each block instance.

A user will be able to add multiple instances of this block to a page, and each will maintain its own independent counter. Clicking the "Increment" button on one block will only affect that specific block's counter and not the others.

## Derived state

**Derived state** in the Interactivity API refers to a value that is computed from other parts of the global state or local context. It's calculated on demand rather than stored. It ensures consistency, reduces redundancies, and enhances the declarative nature of your code.

Derived state is a fundamental concept in modern state management, not unique to the Interactivity API. It's also used in other popular state management systems like Redux, where it's called `selectors`, or Preact Signals, where it's known as `computed` values.

Derived state offers several key benefits that make it an essential part of a well-designed application state, including:

1. **Single source of truth:** Derived state encourages you to store only the essential, raw data in your state. Any values that can be calculated from this core data become derived state. This approach reduces the risk of inconsistencies in your interactive blocks.

2. **Automatic updates:** When you use derived state, values are recalculated automatically whenever the underlying data changes. This ensures that all parts of your interactive blocks always have access to the most up-to-date information without manual intervention.

3. **Simplified state management:** By computing values on-demand rather than storing and updating them manually, you reduce the complexity of your state management logic. This leads to cleaner, more maintainable code.

4. **Improved performance:** In many cases, derived state can be optimized to recalculate only when necessary, potentially improving your interactive blocks' performance.

5. **Easier debugging:** With derived state, it's clearer where data originates and how it's transformed. This can make it easier to track down issues in your interactive blocks.

In essence, derived state allows you to express relationships between different pieces of data in your interactive blocks declaratively, instead of imperatively updating related values whenever something changes.

_Please, visit [The Reactive and Declarative mindset](/docs/reference-guides/interactivity-api/core-concepts/the-reactive-and-declarative-mindset.md) guide to learn more about how to leverage declarative coding in the Interactivity API._

You should use derived state:

-   When a part of your global state or local context can be computed from other state values.
-   To avoid redundant data that needs to be manually kept in sync.
-   To ensure consistency across your interactive blocks by automatically updating derived values.
-   To simplify your actions by removing the need to update multiple related state properties.

### Working with derived state

-   **Initializing the derived state**

    Typically, the derived state should be initialized on the server using the `wp_interactivity_state` function in the exact same way as the global state.

    -   When the initial value is known and static, it can be defined directly:

        ```php
        wp_interactivity_state( 'myCounterPlugin', array(
          'counter' => 1, // This is global state.
          'double'  => 2, // This is derived state.
        ));
        ```

    -   Or it can be defined by doing the necessary computations:

        ```php
        $counter = 1;
        $double  = $counter * 2;

        wp_interactivity_state( 'myCounterPlugin', array(
          'counter' => $counter, // This is global state.
          'double'  => $double,  // This is derived state.
        ));
        ```

    Regardless of the approach, the initial derived state values will be used during the rendering of the page in PHP, and the HTML can be populated with the correct values.

    _Please, visit [the Server-side Rendering guide](/docs/reference-guides/interactivity-api/core-concepts/server-side-rendering.md) to learn more about how directives are processed on the server._

    The same mechanism applies even when the derived state property depends on the local context.

    ```php
    <?php
    $counter = 1;

    // This is the local context.
    $context = array( 'counter' => $counter );

    wp_interactivity_state( 'myCounterPlugin', array(
      'double' => $counter * 2, // This is derived state.
    ));
    ?>

    <div
      data-wp-interactive="myCounterPlugin"
      <?php echo wp_interactivity_data_wp_context( $context ); ?>
    >
      <div>
        Counter: <span data-wp-text="context.counter"></span>
      </div>
      <div>
        Double: <span data-wp-text="state.double"></span>
      </div>
    </div>
    ```

    In JavaScript, the derived state is defined using getters:

    ```js
    const { state } = store( 'myCounterPlugin', {
    	state: {
    		get double() {
    			return state.counter * 2;
    		},
    	},
    } );
    ```

    Derived state can depend on local context, or local context and global state at the same time.

    ```js
    const { state } = store( 'myCounterPlugin', {
    	state: {
    		get double() {
    			const { counter } = getContext();
    			// Depends on local context.
    			return counter * 2;
    		},
    		get product() {
    			const { counter } = getContext();
    			// Depends on local context and global state.
    			return counter * state.factor;
    		},
    	},
    } );
    ```

    In some cases, when the derived state depends on the local context and the local context can change dynamically in the server, instead of the initial derived state, you can use a function (Closure) that calculates it dynamically.

    ```php
    <?php
    wp_interactivity_state( 'myProductPlugin', array(
      'list'    => array( 1, 2, 3 ),
      'factor'  => 3,
      'product' => function() {
        $state   = wp_interactivity_state();
        $context = wp_interactivity_get_context();
        return $context['item'] * $state['factor'];
      }
    ));
    ?>

    <template
      data-wp-interactive="myProductPlugin"
      data-wp-each="state.list"
    >
      <span data-wp-text="state.product"></span>
    </template>
    ```

    This `data-wp-each` template will render this HTML (directives omitted):

    ```html
    <span>3</span>
    <span>6</span>
    <span>9</span>
    ```

-   **Accessing the derived state**

    In the HTML markup, the syntax for the derived state is the same as the one for the global state, just by referencing `state` in the directive attribute values.

    ```html
    <span data-wp-text="state.double"></span>
    ```

    The same happens in JavaScript. Both global state and derived state can be consumed through the `state` property of the store:

    ```js
    const { state } = store( 'myCounterPlugin', {
    	// ...
    	actions: {
    		readValues() {
    			state.counter; // Regular state, returns 1.
    			state.double; // Derived state, returns 2.
    		},
    	},
    } );
    ```

    This lack of distinction is intentional, allowing developers to consume both derived and global state uniformly, and making them interchangeable in practice.

    You can also access the derived state from another derived state and, thus, create multiple levels of computed values.

    ```js
    const { state } = store( 'myPlugin', {
    	state: {
    		get double() {
    			return state.counter * 2;
    		},
    		get doublePlusOne() {
    			return state.double + 1;
    		},
    	},
    } );
    ```

-   **Updating the derived state**

    The derived state cannot be updated directly. To update its values, you need to update the global state or local context on which that derived state depends.

    ```js
    const { state } = store( 'myCounterPlugin', {
    	// ...
    	actions: {
    		updateValues() {
    			state.counter; // Regular state, returns 1.
    			state.double; // Derived state, returns 2.

    			state.counter = 2;

    			state.counter; // Regular state, returns 2.
    			state.double; // Derived state, returns 4.
    		},
    	},
    } );
    ```

### Example: Not using derived state vs using derived state

Let's consider a scenario where there is a counter and the double value needs to be displayed, and let's compare two approaches: one without derived state and one with derived state.

-   **Not using derived state**

    ```js
    const { state } = store( 'myCounterPlugin', {
    	state: {
    		counter: 1,
    		double: 2,
    	},
    	actions: {
    		increment() {
    			state.counter += 1;
    			state.double = state.counter * 2;
    		},
    	},
    } );
    ```

    In this approach, both the `state.counter` and `state.double` values are manually updated in the `increment` action. While this works, it has several drawbacks:

    -   It's less declarative.
    -   It can lead to bugs if `state.counter` is updated from multiple places and developers forget to keep `state.double` in sync.
    -   It requires more cognitive load to remember to update related values.

-   **Using derived state**

    ```js
    const { state } = store( 'myCounterPlugin', {
    	state: {
    		counter: 1,
    		get double() {
    			return state.counter * 2;
    		},
    	},
    	actions: {
    		increment() {
    			state.counter += 1;
    		},
    	},
    } );
    ```

    In this improved version:

    -   `state.double` is defined as a getter, automatically deriving its value from `state.counter`.
    -   The `increment` action only needs to update `state.counter`.
    -   `state.double` is always guaranteed to have the correct value, regardless of how or where `state.counter` is updated.

### Example: Using derived state with local context

Let's now consider a scenario where there is a local context that initializes a counter.

```js
store( 'myCounterPlugin', {
	state: {
		get double() {
			const { counter } = getContext();
			return counter * 2;
		},
	},
	actions: {
		increment() {
			const context = getContext();
			context.counter += 1;
		},
	},
} );
```

```html
<div data-wp-interactive="myCounterPlugin">
	<!-- This will render "Double: 2" -->
	<div data-wp-context='{ "counter": 1 }'>
		Double: <span data-wp-text="state.double"></span>

		<!-- This button will increment the local counter. -->
		<button data-wp-on-async--click="actions.increment">Increment</button>
	</div>

	<!-- This will render "Double: 4" -->
	<div data-wp-context='{ "counter": 2 }'>
		Double: <span data-wp-text="state.double"></span>

		<!-- This button will increment the local counter. -->
		<button data-wp-on-async--click="actions.increment">Increment</button>
	</div>
</div>
```

In this example, the derived state `state.double` reads from the local context present in each element and returns the correct value for each instance where it is used.

### Example: Using derived state with both local context and global state

Let's now consider a scenario where there is a global tax rate and local product prices and calculate the final price, including tax.

```html
<div
	data-wp-interactive="myProductPlugin"
	data-wp-context='{ "priceWithoutTax": 100 }'
>
	<p>Product Price: $<span data-wp-text="context.priceWithoutTax"></span></p>
	<p>Tax Rate: <span data-wp-text="state.taxRatePercentage"></span></p>
	<p>Price (inc. tax): $<span data-wp-text="state.priceWithTax"></span></p>
</div>
```

```js
const { state } = store( 'myProductPlugin', {
	state: {
		taxRate: 0.21,
		get taxRatePercentage() {
			return `${ state.taxRate * 100 }%`;
		},
		get priceWithTax() {
			const { priceWithoutTax } = getContext();
			return price * ( 1 + state.taxRate );
		},
	},
	actions: {
		updateTaxRate( event ) {
			// Updates the global tax rate.
			state.taxRate = event.target.value;
		},
		updatePrice( event ) {
			// Updates the local product price.
			const context = getContext();
			context.priceWithoutTax = event.target.value;
		},
	},
} );
```

In this example, `priceWithTax` is derived from both the global `taxRate` and the local `priceWithoutTax`. Every time you update the global state or local context through the `updateTaxRate` or `updatePrice` actions, the Interactivity API recomputes the derived state and updates the necessary parts of the DOM.

By using derived state, you create a more maintainable and less error-prone codebase. It ensures that related state values are always in sync, reduces the complexity of your actions, and makes your code more declarative and easier to reason about.

## Subscribing to Server State and Context

Interactivity API offers a region-based navigation feature that dynamically replaces a part of the page without a full page reload. The [Query block](/docs/reference-guides/core-blocks.md#query-loop) natively supports this feature when the `Force page reload` toggle is disabled. Developers can use the same functionality in custom blocks by calling [`actions.navigate()`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity-router/#actions) from the [`@wordpress/interactivity-router`](https://github.com/WordPress/gutenberg/tree/trunk/packages/interactivity-router) script module.

When using region-based navigation, it's crucial to ensure that your interactive blocks stay in sync with the server-provided global state and local context. By default, the Interactivity API will never overwrite the global state or local context with the server-provided values. The Interactivity API provides two functions to help manage this synchronization: [`getServerState()`](/docs/reference-guides/interactivity-api/api-reference.md#getserverstate) and [`getServerContext()`](/docs/reference-guides/interactivity-api/api-reference.md#getservercontext).

### `getServerState()`

`getServerState()` allows you to subscribe to changes in the **global state** that occur during client-side navigation. This function is analogous to `getServerContext()`, but it works with the global state instead of the local context.

The `getServerState()` function returns a read-only reactive object. This means that any [callbacks](/docs/reference-guides/interactivity-api/api-reference.md#accessing-data-in-callbacks) you have defined that watch the returned object will only trigger when the value returned by the function changes. If the value remains the same, the callback will not re-trigger.

Let's consider a quiz that has multiple questions. Each question is a separate page. When the user navigates to a new question, the server provides the new question and the time left to answer all the questions.

```php
<div <?php echo wp_interactivity_state( 'myPlugin', array(
	'question' => get_question_for_page( get_the_ID() ),
	'timeLeft' => 5 * 60, // Time to answer all the questions.
) ); ?>>
```

```javascript
import { store, getServerState } from '@wordpress/interactivity';

store( 'myPlugin', {
	actions: {
		// This action would be triggered by a directive, like:
		// <button data-wp-on-click="actions.nextQuestion">Next Question</button>
		*nextQuestion() {
			event.preventDefault( event );
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			actions.navigate( '/question-2' );
		},
	},
	callbacks: {
		// This callback would be triggered by a directive, like:
		// <div data-wp-watch="callbacks.updateQuestion"></div>
		updateQuestion() {
			const serverState = getServerState();

			// Update with the new value coming from the server.
			// We DON'T want to update `timeLeft` because it represents the time left to answer ALL the questions.
			state.question = serverState.question;
		},
	},
} );
```

### `getServerContext()`

`getServerContext()` allows you to subscribe to changes in the **local context** that occur during client-side navigation. This function is analogous to `getServerState()`, but it works with the local context instead of the global state.

The `getServerContext()` function returns a read-only reactive object. This means that any [callbacks](/docs/reference-guides/interactivity-api/api-reference.md#accessing-data-in-callbacks) you have defined that watch the returned object will only trigger when the value returned by the function changes. If the value remains the same, the callback will not re-trigger.

Consider a quiz that has multiple questions. Each question is a separate page. When the user navigates to a new question, the server provides the new question and the time left to answer all the questions.

```php
<div <?php echo wp_interactivity_data_wp_context( array(
	'currentQuestion' => get_question_for_page( get_the_ID() ),
), ); ?>>
```

```javascript
import { store, getServerContext } from '@wordpress/interactivity';

store( 'myPlugin', {
	actions: {
		// This action would be triggered by a directive, like:
		// <button data-wp-on-click="actions.nextQuestion">Next Question</button>
		*nextQuestion() {
			event.preventDefault( event );
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			actions.navigate( '/question-2' );
		},
	},
	callbacks: {
		// This callback would be triggered by a directive, like:
		// <div data-wp-watch="callbacks.updateQuestion"></div>
		updateQuestion() {
			const serverContext = getServerContext();
			const context = getContext();

			// Update with the new value coming from the server.
			context.currentQuestion = serverContext.currentQuestion;
		},
	},
} );
```

### When to Use

Whenever you have interactive blocks that rely on global state or local context that may change due to navigation events, ensuring consistency across different parts of your application.

### Best Practices for using `getServerState()` and `getServerContext()`

-   **Read-Only References:** Both `getServerState()` and `getServerContext()` return read-only objects. You can use those objects to update the global state or local context.
-   **Callback Integration:** Incorporate these functions within your store [callbacks](/docs/reference-guides/interactivity-api/api-reference.md#accessing-data-in-callbacks) to react to state and context changes. Both `getServerState()` and `getServerContext()` return reactive objects. This means that their watch callbacks will only trigger when the value of a property changes. If the value remains the same, the callback will not re-trigger.

## Conclusion

Remember, the key to effective state management is to keep your state minimal and avoid redundancy. Use derived state to compute values dynamically, and choose between global state and local context based on the scope and requirements of your data. This will lead to a cleaner, more robust architecture that is easier to debug and maintain. Finally, if you need to synchronize the state or context with the server, you can use `getServerState()` and `getServerContext()` to achieve this.
