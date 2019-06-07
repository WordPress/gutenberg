# Snackbar

Use Snackbars to communicate low priority, non-interruptive messages to the user.

![Snackbar Example](https://wordpress.org/gutenberg/files/2019/06/snackbar-preview.png)

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Accessibility guidelines](#accessibility-guidelines)
3. [Development guidelines](#development-guidelines)
4. [Related components](#related-components)

## Design guidelines

### Usage

A Snackbar displays a temporary, succinct message. It can also offer the user the option to perform a single action, like view a published post. 

#### Principles

- **Informational:** Snackbars provide updates on a process. Use them to let users know that things are working as expected.
- **Temporary:** Snackbars appear temporarily, and disappear on their own.
- **Contextual:** Snackbars appear in the context in which the user is working, and don’t get in the way.

#### Actions

A Snackbar can optionally contain a single action. Snackbars disappear automatically, whether the user interacts with them or not, so that action should not be “Dismiss” or “Cancel.” The action should also be available elsewhere in the UI.

#### When to Use

Snackbars communicate low-priority messages that are minimally interruptive and don’t require user action.

For error messages, or for important, persistent messages, use a Notice instead.

### Anatomy

![](https://wordpress.org/gutenberg/files/2019/06/snackbar-anatomy.png)

1. Text label
2. Container
3. Action (Optional)
4. Focus state

#### Text Label

Snackbars contain a text label that directly relates to the process being described.
Text labels are short, clear updates, and normally display on one line. 

![](https://wordpress.org/gutenberg/files/2019/06/snackbar-text-label-do1.png)

**Do:** Let labels wrap onto two lines on small screens.

![](https://wordpress.org/gutenberg/files/2019/06/snackbar-text-label-do2.png)
**Do:** Let the width of Snackbars expand on larger screens.

#### Containers

Snackbars are displayed in rectangular containers with a dark grey background. Containers should be completely opaque so the text labels remain legible. 

In wide layouts, the container width can be extended to accommodate longer text labels.

![](https://wordpress.org/gutenberg/files/2019/06/snackbar-container-dont1.png)

**Don’t:** Do not change the color of the background.

![](https://wordpress.org/gutenberg/files/2019/06/snackbar-container-dont2.png)

**Don’t:** Do not use icons within a Snackbar.

### Placement

Snackbars appear on the bottom left of the screen. On smaller screens, they can take up the available width. 

### Action

Along with their text labels, Snackbars can display a single text button to let users interact with the process being performed. Snackbars shouldn’t be the only way to access a core function or to make something usable.

![](https://wordpress.org/gutenberg/files/2019/06/snackbar-action-dont1.png)

**Don’t:** Do not use buttons inside of snackbars. 

![](https://wordpress.org/gutenberg/files/2019/06/snackbar-action-dont2.png)

**Don’t:** Do not use more than one action button in a snackbar.

![](https://wordpress.org/gutenberg/files/2019/06/snackbar-action-dont3.png)

**Don’t:** Do not include a “Dismiss” action, since the snackbar will dismiss automatically. 

## Accessibility guidelines

### Actions

Ensure any action is also available elsewhere in the UI so that all users can reach it. An action link should be supplementary.

### Errors

Do not use a Snackbar for error messages. Use a Notice component for error messages, so they're persistent and all users will be certain to see it.

### Screen readers

Use `role: status` and `aria-live: polite` to ensure the message is read out, but isn't given prominence over other, more critical elements.

### Dismissability & focus

Focus should not move to the notification unless the user expressly moves to it.

The Snackbar should disappear after at least 10 seconds, to allow people time to interact with it and should also be dismissable (even if via a non-visible action, like tapping on the snackbar itself) so as to ensure it doesn't get in users' way and allow for more choice.

Pressing the ESC key while one of the snackbar’s child elements has focus (e.g., the action button) will dismiss the snackbar.

### Copy 

Since this message will only be shown for a short time, copy within the snackbar should be clear and concise.

## Development guidelines

### Usage

To display a plain snackbar, pass the message as a `children` prop:

```jsx
const MySnackbarNotice = () => (
	<Snackbar>
		Post published successfully.
	</Snackbar>
);
```

For more complex markup, you can pass any JSX element:

```jsx
const MySnackbarNotice = () => (
	<Snackbar>
		<p>An error occurred: <code>{ errorDetails }</code>.</p>
	</Snackbar>
);
```

#### Props

The following props are used to control the display of the component.

* `onRemove`: function called when dismissing the notice.
* `actions`: (array) an array of action objects. Each member object should contain a `label` and either a `url` link string or `onClick` callback function. A `className` property can be used to add custom classes to the button styles.

## Related components

- To create a prominent message that requires a higher-level of attention, use a Notice.
