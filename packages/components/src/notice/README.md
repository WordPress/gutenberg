# Notice

Use Notices to communicate prominent messages to the user.

![Notice component](https://make.wordpress.org/design/files/2019/03/Notice-Screenshot-alt.png)

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

A Notice displays a succinct message. It can also offer the user options, like viewing a published post or updating a setting, and requires a user action to be dismissed.

Use Notices to communicate things that are important but don’t necessarily require action — a user can keep using the product even if they don’t choose to act on a Notice. They are less interruptive than a Modal.

### Anatomy

![Diagram of a Notice component with numbered labels](https://make.wordpress.org/design/files/2019/03/Notice-Anatomy.png)

1. Container (status indicated with color)
2. Icon (optional)
3. Message
4. Dismiss icon (optional)

### Usage

Notices display at the top of the screen, below any toolbars anchored to the top of the page. They’re persistent and non-modal. Since they don’t overlay the content, users can ignore or dismiss them, and choose when to interact with them.

![](https://make.wordpress.org/design/files/2019/03/Notice-States.png)

Notices are color-coded to indicate the type of message being communicated:

- **Default** notices have **no background**.
- **Informational** notices are **blue.**
- **Success** notices are **green.**
- **Warning** notices are **yellow****.**
- **Error** notices are **red.**

If an icon is included in the Notice, it should be color-coded to match the Notice state.

![A success Notice for updating a post](https://make.wordpress.org/design/files/2019/03/Notice-Do-1-alt.png)

**Do**
Do use a Notice when you want to communicate a message of medium importance.

![A Notice that requires an immediate action](https://make.wordpress.org/design/files/2019/03/Notice-Dont-1-alt.png)

**Don’t**
Don't use a Notice for a message that requires immediate attention and action from the user. Use a Modal for this instead.

![A success Notice for publishing a post](https://make.wordpress.org/design/files/2019/03/Notice-Do-2-alt.png)

**Do**
Do display Notices at the top of the screen, below any toolbars.

![A success Notice on top of the editor toolbar](https://make.wordpress.org/design/files/2019/03/Notice-Dont-2-alt.png)

**Don’t**
Don't show Notices on top of toolbars.

![An error Notice using red](https://make.wordpress.org/design/files/2019/03/Notice-Do-3-alt.png)

**Do**
Do use color to indicate the type of message being communicated.

![An error Notice using purple](https://make.wordpress.org/design/files/2019/03/Notice-Dont-3-alt.png)

**Don’t**
Don't apply any colors other than those for Warnings, Success, or Errors.

## Development guidelines

### Usage

To display a plain notice, pass `Notice` a string:

```jsx
const MyNotice = () => (
	<Notice status="error">
		An unknown error occurred.
	</Notice>
);
```

For more complex markup, you can pass any JSX element:

```jsx
const MyNotice = () => (
	<Notice status="error">
		<p>An error occurred: <code>{ errorDetails }</code>.</p>
	</Notice>
);
```

#### Props

The following props are used to control the display of the component.

* `status`: (string) can be `warning` (yellow), `success` (green), `error` (red).
* `onRemove`: function called when dismissing the notice
* `isDismissible`: (boolean) defaults to true, whether the notice should be dismissible or not
* `actions`: (array) an array of action objects. Each member object should contain a `label` and either a `url` link string or `onClick` callback function. A `className` property can be used to add custom classes to the button styles. By default, some classes are used (e.g: is-link or is-default) the default classes can be removed by setting property `noDefaultClasses` to `false`.

## Related components

- To create a more prominent message that requires action, use a Modal.
