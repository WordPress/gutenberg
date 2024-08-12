# Understanding global state, local context and derived state

The Interactivity API offers a powerful framework for creating interactive blocks. To make the most of its capabilities, it's crucial to understand when to use global state, local context, or derived state. This guide will clarify these concepts and provide practical examples to help you decide when to use each one.

Let's start with a brief definition of global state, local context and derived state.

-   **Global state:** Global data that can be accessed and modified by any interactive block on the page, allowing different parts of your application to stay in sync.
-   **Local context:** Local data defined within a specific element in the HTML structure, accessible only to that element and its children, providing independent state for individual blocks.
-   **Derived state:** Computed values based on global state or local context, dynamically calculated on-demand to ensure consistent data representation without storing redundant data.

Let's now dive into each of these concepts to study them in more detail and provide some examples!

## Global state

**Global state** in the Interactivity API refers to global data that can be accessed and modified by any interactive block on the page. It serves as a shared information hub, allowing different parts of your application to communicate and stay in sync. Global state is the ideal mechanism for exchanging information between blocks, regardless of their position in the DOM tree.

You should use global state when:

-   You need to share data between multiple blocks that are not directly related in the DOM hierarchy.
-   You want to maintain a single source of truth for certain data across your entire application.
-   You're dealing with data that affects multiple parts of your UI simultaneously.
-   You want to implement features that are global for the page.

### Working with global state

-   **Initializing the global state**

    Typically, the initial global state values should be defined on the server using the `wp_interactivity_state` function:

    ```php
    // Populates the initial global state values.
    wp_interactivity_state( 'myPlugin', array(
      'counter' => 0,
      'shown' => false,
      'highlighted' => true,
    ));
    ```

    In this way, the initial global state values will be used during the rendering of the page in PHP, and the HTML can be populated with the correct values. For example, these directives will produce the following result.

    Original, as written in the PHP file:

    ```html
    <span
    	data-wp-bind--hidden="!state.shown"
    	data-wp-class--is-highlighted="state.highlighted"
    	data-wp-text="state.counter"
    	class="my-span"
    ></span>
    ```

    Rendered and sent to the browser:

    ```html
    <span
    	data-wp-bind--hidden="!state.shown"
    	data-wp-class--is-highlighted="state.highlighted"
    	data-wp-text="state.counter"
    	hidden
    	class="my-span is-highlighted"
    >
    	0
    </span>
    ```

    Please refer to this [guide about server-side rendering](REPLACE_WITH_FINAL_LINK) for more information about this processing.

    In cases where the global state is not used during the rendering of the page in PHP, it can also be defined directly on the client:

    ```js
    const { state } = store( 'myPlugin', {
    	state: {
    		isLoading: false,
    	},
    	actions: {
    		loadSomething() {
    			state.isLoading = true;
    			// ...
    		},
    	},
    } );
    ```

-   **Accessing the global state**

    In the HTML, you can access the global state values directly by referencing `state` in the directive values:

    ```html
    <div data-wp-bind--hidden="!state.isOpen">
    	<span data-wp-text="state.counter"></span>
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
    		// ...
    	},
    } );
    ```

    The global state initialized on the server using the `wp_interactivity_state` function is also included in that object:

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
    		readValues() {
    			// Exists and its initial value is 1.
    			state.someValue;
    			// Exists and its initial value is 2.
    			state.otherValue;
    		},
    	},
    } );
    ```

    Lastly, all calls to the `store` function with the same namespace are merged together:

    ```js
    store( 'myPlugin', { state: { someValue: 1 } } );

    store( 'myPlugin', { state: { otherValue: 2 } } );

    // All calls to `store` return a stable reference (the same object).
    const { state } = store( 'myPlugin' );

    store( 'myPlugin', {
    	actions: {
    		readValues() {
    			// Exists and its initial value is 1.
    			state.someValue;
    			// Exists and its initial value is 2.
    			state.otherValue;
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

### Example: Two blocks using global state to communicate

In this example, there are two independent blocks. One displays a counter, and the other a button to increment that counter. These blocks can be positioned anywhere on the page, regardless of the HTML structure. In other words, one does not need to be an inner block of the other.

-   **Count Block**

    ```php
    <?php
    wp_interactivity_state( 'myPlugin', array(
      'counter' => 0
    ));
    ?>

    <div
      data-wp-interactive="myPlugin"
      <?php echo get_block_wrapper_attributes(); ?>
    >
      Count: <span data-wp-text="state.counter"></span>
    </div>
    ```

-   **Increment Block**

    ```php
    <div
      data-wp-interactive="myPlugin"
      <?php echo get_block_wrapper_attributes(); ?>
    >
      <button data-wp-on--click="actions.increment">
        Increment
      </button>
    </div>
    ```

    ```js
    const { state } = store( 'myPlugin', {
    	actions: {
    		increment() {
    			state.counter += 1;
    		},
    	},
    } );
    ```

In this example:

1. The global state is initialized on the server using `wp_interactivity_state`, setting an initial `counter` of 0.
2. The Count Block displays the current counter using `data-wp-text="state.counter"`, which reads from the global state.
3. The Increment Block contains a button that triggers the `increment` action when clicked, using `data-wp-on--click="actions.increment"`.
4. In JavaScript, the `increment` action directly modifies the global state by incrementing `state.counter`.

Both blocks are independent and can be placed anywhere on the page. They don't need to be nested or directly related in the DOM structure. Multiple instances of these blocks can be added to the page, and they will all share and update the same global count value.

## Local context

Local context is data defined within a specific element in the HTML structure. Unlike global state, local context is only accessible to the element where it's defined and its child elements.

Local context is particularly useful when you need independent state for individual blocks, ensuring that each instance of a block can maintain its own unique data without interfering with others.

You should use local context when:

-   You need to maintain separate state for multiple instances of the same block.
-   You want to encapsulate data that's only relevant to a specific block and its children.
-   You need to implement features that are isolated to a specific part of your UI.

### Working with local context

-   **Initializing the local context**

    Local context is initialized directly within the HTML structure using the `data-wp-context` directive. This directive accepts a JSON string that defines the initial values for that piece of context.

    ```html
    <div data-wp-context='{ "counter": 0 }'>
    	<!-- Child elements will have access to `context.counter` -->
    </div>
    ```

    You can also initialize the local context on the server using the `wp_interactivity_data_wp_context` PHP helper, which ensures proper escaping and formatting of the stringified values:

    ```php
    <?php
    $context = array(
      'counter' => 0,
    );
    ?>

    <div <?php echo wp_interactivity_data_wp_context( $context ); ?>>
      <!-- Child elements will have access to `context.counter` -->
    </div>
    ```

-   **Accessing the local context**

    In the HTML, you can access local context values directly by referencing `context` in the directive values:

    ```html
    <div data-wp-bind--hidden="!context.isOpen">
    	<span data-wp-text="context.counter"></span>
    </div>
    ```

    In JavaScript, you can access the local context using the `getContext` function:

    ```js
    store( 'myPlugin', {
    	actions: {
    		logCounter() {
    			const { counter } = getContext();
    			console.log( `Current counter: ${ counter }` );
    		},
    	},
    } );
    ```

    The `getContext` function returns the local context of the element that triggered the action/callback execution.

-   **Updating the local context**

    To update the local context in JavaScript, you can modify the object returned by `getContext`:

    ```js
    store( 'myPlugin', {
    	actions: {
    		increment() {
    			const context = getContext();
    			context.count += 1;
    		},
    		updateName( event ) {
    			const context = getContext();
    			context.name = event.target.value;
    		},
    	},
    } );
    ```

    Changes to the local context will automatically trigger updates in any directives that depend on the modified values.

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

### Example: One block using local context to have independent state

In this example, there is a single block that shows a counter and can increment it. By using local context, each instance of this block will have its own independent counter, even if multiple blocks are added to the page.

```php
<div
  data-wp-interactive="myPlugin"
  <?php echo get_block_wrapper_attributes(); ?>
  data-wp-context='{ "counter": 0 }'
>
  <p>Counter: <span data-wp-text="context.counter"></span></p>
  <button data-wp-on--click="actions.increment">Increment</button>
</div>
```

```js
store( 'myPlugin', {
	actions: {
		increment() {
			const context = getContext();
			context.counter += 1;
		},
	},
} );
```

In this example:

1. A local context with an initial `counter` of `0` is defined using the `data-wp-context` directive.
2. The counter is displayed using `data-wp-text="context.counter"`, which reads from the local context.
3. The increment button uses `data-wp-on--click="actions.increment"` to trigger the increment action.
4. In JavaScript, the `getContext` function is used to access and modify the local context for each block instance.

A user will be able to add multiple instances of this block to a page, and each will maintain its own independent counter. Clicking the "Increment" button on one block will only affect that specific block's count and not the others.

## Derived state

Derived state is a computed value based on other parts of the global state or local context. It's calculated on demand rather than stored.

Derived state is a fundamental concept in state management, not unique to the Interactivity API. It's also used in other popular state management systems like Redux (where it's called "Selectors") or Preact Signals (where it's known as "computed" values).

At its core, derived state addresses a common challenge in application development: maintaining consistency and reducing redundancy in your data.

Here's why derived state is important:

1. **Single source of truth:** Derived state encourages you to store only the essential, raw data in your state. Any values that can be calculated from this core data become derived state. This approach reduces the risk of inconsistencies in your application.

2. **Automatic updates:** When you use derived state, values are recalculated automatically whenever the underlying data changes. This ensures that all parts of your application always have access to the most up-to-date information without manual intervention.

3. **Simplified state management:** By computing values on-demand rather than storing and updating them manually, you reduce the complexity of your state management logic. This leads to cleaner, more maintainable code.

4. **Improved performance:** In many cases, derived state can be optimized to recalculate only when necessary, potentially improving your application's performance.

5. **Easier debugging:** With derived state, it's clearer where data originates and how it's transformed. This can make it easier to track down issues in your application.

In essence, derived state allows you to express relationships between different pieces of data in your application declaratively. Instead of imperatively updating related values whenever something changes, you define how these values should be computed based on your raw state.

You should use derived state:

-   When a part of your global state or local context can be computed from other state values.
-   To avoid redundant data that needs to be manually kept in sync.
-   To ensure consistency across your application by automatically updating derived values.
-   To simplify your actions by removing the need to update multiple related state properties.

### Working with derived state

-   **Initializing the derived state**

    Typically, the derived state should be initialized on the server using the `wp_interactivity_state` function in the exact same way as the global state:

    ```php
    // Populates both the initial global and derived state values.
    wp_interactivity_state( 'myPlugin', array(
      'counter' => 1, // This is global state.
      'double' => 2, // This is derived state.
    ));
    ```

    In this way, the initial derived state values will be used during the rendering of the page in PHP, and the HTML can be populated with the correct values.

    This same mechanism applies even when the derived state property depends on the local context.

    ```php
    <?php
    $context = array(
      'counter' => 1 // This is local context.
    );
    wp_interactivity_state( 'myPlugin', array(
      'double' => 2, // This is derived state.
    ));
    ?>

    <div <?php echo wp_interactivity_data_wp_context( $context ); ?>>
      <div>
        Counter: <span data-wp-text="context.counter"></span>
      </div>
      <div>
        Double: <span data-wp-text="state.double"></span>
      </div>
    </div>
    ```

    In the client, the derived state is defined using getters:

    ```js
    const { state } = store( 'myPlugin', {
    	state: {
    		get double() {
    			return state.counter * 2;
    		},
    	},
    } );
    ```

    Derived state can also depend on local context, or local context and global state at the same time.

    ```js
    const { state } = store( 'myPlugin', {
    	state: {
    		get double() {
    			const { counter } = getContext();
    			return counter * 2;
    		},
    		get product() {
    			const { counter } = getContext();
    			return counter * state.factor;
    		},
    	},
    } );
    ```

    In some cases, when the derived state depends on the local context and the local context can change dynamically in the server, instead of the initial derived state, you can use a function (Closure) that calculates it dynamically.

    ```php
    <?php
    wp_interactivity_state( 'myPlugin', array(
      'list'    => array( 1, 2, 3 ),
      'factor'  => 3,
      'product' => function() {
        $state   = wp_interactivity_state();
        $context = wp_interactivity_get_context();
        return $context['item'] * $state['factor'];
      }
    ));
    ?>

    <template data-wp-each="state.list">
      <span data-wp-text="state.product"></span>
    </template>
    ```

    This `data-wp-each` template will render this HTML:

    ```html
    <span data-wp-text="state.product">3</span>
    <span data-wp-text="state.product">6</span>
    <span data-wp-text="state.product">9</span>
    ```

-   **Accessing the derived state**

    In the HTML, the syntax for the derived state is the same as the one for the global state, just by referencing `state` in the directive values.

    ```html
    <span data-wp-text="state.double"></span>
    ```

    Actually, there is no way to distinguish between derived state and global state when consuming it.

    The same happens in Javascript.

    ```js
    const { state } = store( 'myPlugin', {
    	// ...
    	actions: {
    		readValues() {
    			state.counter; // Regular state, returns 1.
    			state.double; // Derived state, returns 2.
    		},
    	},
    } );
    ```

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
    const { state } = store( 'myPlugin', {
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
    const { state } = store( 'myPlugin', {
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
    const { state } = store( 'myPlugin', {
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

Let's consider a scenario where there is a local context that initializes a counter.

```js
store( 'myPlugin', {
	state: {
		get double() {
			const { counter } = getContext();
			return counter * 2;
		},
	},
	actions: {
		increment() {
			const ctx = getContext();
			ctx.counter += 1;
		},
	},
} );
```

```html
<!-- This will render "1 -> 2" -->
<div data-wp-context='{ "counter": 1 }'>
	<div>
		<span data-wp-text="context.counter"></span>
		->
		<span data-wp-text="state.double"></span>
	</div>

	<!-- This button will increment the local counter. -->
	<button data-wp-on--click="actions.increment">Increment</button>
</div>

<!-- This will render "2 -> 4" -->
<div data-wp-context='{ "counter": 2 }'>
	<div>
		<span data-wp-text="context.counter"></span>
		->
		<span data-wp-text="state.double"></span>
	</div>

	<!-- This button will increment the local counter. -->
	<button data-wp-on--click="actions.increment">Increment</button>
</div>
```

In this example, the derived state `state.double` reads from the local context present in each element and returns the correct value for each instance where it is used.

### Example: Using derived state with both local context and global state

Let's consider a scenario where there are a global tax rate and local product prices and calculate the final price, including tax.

```html
<div data-wp-context='{ "priceWithoutTax": 100 }'>
	<div>
		Product Price: $<span data-wp-text="context.priceWithoutTax"></span>
	</div>
	<div>Tax Rate: <span data-wp-text="state.taxRatePercentage"></span></div>
	<div>
		Price (inc. tax): $<span data-wp-text="state.priceWithTax"></span>
	</div>
</div>
```

```js
const { state } = store( 'myPlugin', {
	state: {
		taxRate: 0.21,
		get taxRatePercentage() {
			return `${ state.taxRate * 100 }%`;
		},
		get priceWithTax() {
			const { priceWithoutTax } = getContext();
			return Math.round( price * ( 1 + state.taxRate ) * 100 ) / 100;
		},
	},
	actions: {
		updateTaxRate( event ) {
			// Updates the global tax rate.
			state.taxRate = event.target.value;
		},
		updatePrice( event ) {
			// Updates the local product price.
			const ctx = getContext();
			ctx.priceWithoutTax = event.target.value;
		},
	},
} );
```

In this example, `priceWithTax` is derived from both the global `taxRate` and the local `priceWithoutTax`.

By using derived state, you create a more maintainable and less error-prone codebase. It ensures that related state values are always in sync, reduces the complexity of your actions, and makes your code more declarative and easier to reason about.

## Conclusion

Understanding and effectively utilizing global state, local context, and derived state is crucial for leveraging the full power of the Interactivity API. By following the guidelines and examples provided in this guide, you can make informed decisions on when and how to use these state management techniques to create efficient, scalable, and maintainable interactive blocks.

Remember, the key to effective state management is to keep your state minimal and avoid redundancy. Use derived state to compute values dynamically, and choose between global state and local context based on the scope and requirements of your data. This will lead to a cleaner, more robust application architecture that is easier to debug and maintain.
