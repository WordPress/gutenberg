# The Reactive and Declarative mindset

The Interactivity API is a reactive and declarative framework, similar to other modern frameworks like React, Vue, Svelte, or Alpine. When working with the Interactivity API, adopting the right mindset is crucial for maximizing its potential. This guide will explain the core concepts of reactivity and declarativeness, providing a foundation for effective use of the Interactivity API.

## Declarative vs. imperative

**Declarative Programming** describes _what_ a program should accomplish. It focuses on the desired outcome without explicitly listing commands or steps to achieve that result. In contrast, **imperative programming** specifies _how_ to accomplish tasks by explicitly stating each step to manipulate the program’s state.

### The imperative approach

In the early days of web development, the imperative approach was predominant. This method involves manually updating the DOM with JavaScript to reflect changes.

Take, for example, this interactive block with two buttons and a paragraph:

-   **The show/hide button**: Toggles paragraph visibility and enables/disables the "Activate" button.
-   **The activate/deactivate button**: Toggles the paragraph's text and color between "active" (green) and "inactive" (red).

```html
<div id="my-interactive-plugin">
	<button
		id="show-hide-btn"
		aria-expanded="false"
		aria-controls="status-paragraph"
	>
		show
	</button>
	<button id="activate-btn" disabled>activate</button>
	<p id="status-paragraph" class="inactive" hidden>this is inactive</p>
</div>

<script>
	const showHideBtn = document.getElementById( 'show-hide-btn' );
	const activateBtn = document.getElementById( 'activate-btn' );
	const statusParagraph = document.getElementById( 'status-paragraph' );

	showHideBtn.addEventListener( 'click', () => {
		if ( statusParagraph.hasAttribute( 'hidden' ) ) {
			statusParagraph.removeAttribute( 'hidden' );
			showHideBtn.textContent = 'hide';
			showHideBtn.setAttribute( 'aria-expanded', 'true' );
			activateBtn.removeAttribute( 'disabled' );
		} else {
			if ( statusParagraph.classList.contains( 'active' ) ) {
				statusParagraph.textContent = 'this is inactive';
				statusParagraph.classList.remove( 'active' );
				activateBtn.textContent = 'activate';
			}
			statusParagraph.setAttribute( 'hidden', true );
			showHideBtn.textContent = 'show';
			showHideBtn.setAttribute( 'aria-expanded', 'false' );
			activateBtn.setAttribute( 'disabled', true );
		}
	} );

	activateBtn.addEventListener( 'click', () => {
		if ( activateBtn.textContent === 'activate' ) {
			statusParagraph.textContent = 'this is active';
			statusParagraph.classList.remove( 'inactive' );
			statusParagraph.classList.add( 'active' );
			activateBtn.textContent = 'deactivate';
		} else {
			statusParagraph.textContent = 'this is inactive';
			statusParagraph.classList.remove( 'active' );
			statusParagraph.classList.add( 'inactive' );
			activateBtn.textContent = 'activate';
		}
	} );
</script>
```

As you can see, for each condition, you have to use JavaScript to modify everything in the DOM that has changed, taking into account the previous state.

### The declarative approach

The declarative approach simplifies the process by focusing on _what_ should happen. The UI updates automatically in response to changes in state. Here is a similar example using the Interactivity API's declarative approach:

```html
<div id="my-interactive-plugin" data-wp-interactive="myInteractivePlugin">
	<button
		data-wp-on--click="actions.toggleVisibility"
		data-wp-bind--aria-expanded="state.isVisible"
		data-wp-text="state.visibilityText"
		aria-controls="status-paragraph"
	>
		show
	</button>
	<button
		data-wp-on--click="actions.toggleActivation"
		data-wp-bind--disabled="!state.isVisible"
		data-wp-text="state.activationText"
	>
		activate
	</button>
	<p
		id="status-paragraph"
		data-wp-bind--hidden="!state.isVisible"
		data-wp-class--active="state.isActive"
		data-wp-class--inactive="!state.isActive"
		data-wp-text="state.paragraphText"
	>
		this is inactive
	</p>
</div>
```

```js
import { store } from '@wordpress/interactivity';

const { state } = store( 'myInteractivePlugin', {
	state: {
		isVisible: false,
		isActive: false,
		get visibilityText() {
			return state.isVisible ? 'hide' : 'show';
		},
		get activationText() {
			return state.isActive ? 'deactivate' : 'activate';
		},
		get paragraphText() {
			return state.isActive ? 'this is active' : 'this is inactive';
		},
	},
	actions: {
		toggleVisibility() {
			state.isVisible = ! state.isVisible;
			if ( ! state.isVisible ) state.isActive = false;
		},
		toggleActivation() {
			state.isActive = ! state.isActive;
		},
	},
} );
```

In this declarative example, the UI automatically updates based on the current state. All you have to do as developers is to declare the necessary state, any derived state, the actions that modify the state, and which parts of the DOM depend on which parts of the state. The framework takes care of making all the necessary updates to the DOM so that it is always in sync with the current state. The logic remains simple and maintainable regardless of the number of elements controlled by the framework.

### Can you spot the bug?

In the imperative example, a bug has been intentionally introduced for didactical purposes. Can you find it? It's not easy!

<details>
<summary>Show me the answer!</summary>

In the case that the Show button is pressed first, then the Activate button, and finally the Hide button, it doesn't add the `inactive` class using `statusParagraph.classList.add('inactive');`. Therefore, the next time the user presses Show, the paragraph will not appear in red.

</details>

These types of bugs are very common in imperative code because you have to manually control all the conditions. On the other hand, they do not exist in declarative code because the framework takes care of updating the DOM and never forgets about anything.

### Benefits of the declarative approach

As demonstrated, the imperative approach requires detailed steps and direct manipulation of the DOM, which can quickly become complex and hard to maintain as the interactivity complexity grows. The more possible states and elements there are, the more conditional logic needs to be added, making the code exponentially more complicated. The declarative approach, on the other hand, simplifies the process by managing the state and letting the framework handle the DOM updates. This leads to more readable, maintainable, and scalable code.

## Reactivity

The Interactivity API is a declarative framework thanks to its leverage of reactivity. In a reactive system, changes to the data automatically trigger updates in the user interface, ensuring that the view always reflects the current state of the application.

### How reactivity works

The Interactivity API uses a fine-grained reactivity system. Here's how it works:

1. **Reactive State**: In the Interactivity API, both the global state and the local context are reactive. This means that when either of these data sources changes, any parts of the UI that depend on them will automatically update.

    - **Global state**: This is global data that can be accessed throughout your interactive blocks.
    - **Local context**: This is local data that is specific to a particular element and its children.
    - **Derived State**: In addition to basic state properties, you can define computed properties that automatically update when their dependencies change.

    _Please, visit the [Understanding global state, local context and derived state](/docs/reference-guides/interactivity-api/core-concepts/undestanding-global-state-local-context-and-derived-state.md) guide to learn more about how to work with the different types of reactive state in the Interactivity API._

2. **Actions**: These are functions, usually triggered by event handlers, that mutate the global state or local context.

3. **Reactive Bindings**: HTML elements are bound to reactive state values using special attributes like `data-wp-bind`, `data-wp-text`, or `data-wp-class`.

4. **Automatic Updates**: When the actions mutate the global state or local context, the Interactivity API automatically updates all the parts of the DOM that depend on that state (either directly or through the derived state).

Let's break down these concepts by reviewing the previous example:

```javascript
const { state } = store( 'myInteractivePlugin', {
	state: {
		isVisible: false,
		isActive: false,
		get visibilityText() {
			return state.isVisible ? 'hide' : 'show';
		},
		// ... other derived state
	},
	actions: {
		toggleVisibility() {
			state.isVisible = ! state.isVisible;
		},
		// ... other actions
	},
} );
```

In this code:

-   `isVisible` and `isActive` are basic state properties.
-   `visibilityText` is a derived state that automatically updates when `isVisible` changes.
-   `toggleVisibility` is an action that modifies the state.

The HTML bindings look like this:

```html
<button
	data-wp-on--click="actions.toggleVisibility"
	data-wp-text="state.visibilityText"
	data-wp-bind--aria-expanded="state.isVisible"
>
	show
</button>
```

Here's how reactivity works in practice:

1. When the button is clicked, it triggers the `toggleVisibility` action.
2. This action updates `state.isVisible`.
3. The Interactivity API detects this change and automatically:
    - Updates the button's text content (because of `data-wp-text="state.visibilityText"`).
    - Changes the `aria-expanded` attribute (due to `data-wp-bind--aria-expanded="state.isVisible"`).
    - Updates any other parts of the DOM that depend on `isVisible` or `visibilityText`.

### Mutability vs immutability

Unlike many other reactive frameworks, **the Interactivity API does not require the use of immutability** when updating the global state or the local context. You can directly mutate objects and arrays, and the reactivity system will still work as expected. This can lead to more intuitive and straightforward code in many cases.

For example, you can push a new item to an array like this:

```javascript
const { state } = store( 'myArrayPlugin', {
	state: {
		list: [ 'item 1', 'item 2' ],
	},
	actions: {
		addItem() {
			// Right:
			state.list.push( 'new item' );

			// Wrong:
			state.list = [ ...state.list, 'new item' ]; // Don't do this!
		},
	},
} );
```

There's no need to create a new array or use the spread operator as you might in other frameworks. The Interactivity API will detect this change and update any parts of the UI that depend on `state.list`.

### Reactive side effects

In addition to automatically updating the UI, the Interactivity API allows you to perform side effects when reactive data changes using directives like `data-wp-watch`. Side effects are useful for tasks like logging, making API calls, or updating other parts of your application that aren't directly tied to the UI.

Here's an example of how you might use `data-wp-watch`:

```html
<div
	data-wp-interactive="myCounterPlugin"
	data-wp-context='{ "counter": 0 }'
	data-wp-watch="callbacks.logCounter"
>
	<p>Counter: <span data-wp-text="context.counter"></span></p>
	<button data-wp-on--click="actions.increment">Increment</button>
</div>
```

```javascript
store( 'myCounterPlugin', {
	actions: {
		increment() {
			const context = getContext();
			context.counter += 1;
		},
	},
	callbacks: {
		logCounter: () => {
			const context = getContext();
			console.log( `The counter is now: ${ context.counter }` );
		},
	},
} );
```

In this example:

1. The `data-wp-context` directive adds a local context with a property `counter` whose value is `0`.
2. The `data-wp-watch` directive is set to `callbacks.logCounter`.
3. Every time `context.counter` changes, the `logCounter` callback will be executed.
4. The `logCounter` callback logs the current counter to the console.

This allows you to create declarative side effects that automatically run in response to data changes. Some other use cases for `data-wp-watch` might include:

-   Saving data to `localStorage` when the data changes.
-   Sending analytics events.
-   Changing the focus for accessibility purposes.
-   Updating the page title, meta tags, or `<body>` attributes.
-   Triggering animations.

## Conclusion

As you continue to work with the Interactivity API, remember to think in terms of state, actions, and side effects. Define your data, describe how it should change, and let the Interactivity API handle the rest. This mental shift may take some time, especially if you're used to more imperative programming styles, but by embracing it, you'll unlock the full potential of the Interactivity API to create truly dynamic and interactive WordPress blocks that delight your users.
