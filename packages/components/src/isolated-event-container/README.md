# Isolated Event Container

This is a container that prevents certain events from propagating outside of the container. This is used to wrap
UI elements such as modals and popovers where the propagated event can cause problems. The event continues to work
inside the component.

For example, a `mousedown` event in a modal container can propagate to the surrounding DOM, causing UI outside of the
modal to be interacted with.

The current isolated events are:
- mousedown - This prevents UI interaction with other `mousedown` event handlers, such as selection

## Usage

Creates a custom component that won't propagate `mousedown` events outside of the component.

```jsx
import { IsolatedEventContainer } from '@wordpress/components';

const MyModal = () => {
	return (
		<IsolatedEventContainer
			className="component-some_component"
			onClick={ clickHandler }
		>
			<p>This is an isolated component</p>
		</IsolatedEventContainer>
	);
};
```

## Props

All props are passed as-is to the `<IsolatedEventContainer />`
