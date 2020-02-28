# PrimitiveButton
Buttons let users take actions and make choices with a single click or tap.

![Button components](https://make.wordpress.org/design/files/2019/03/button.png)

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)

## Design guidelines

### Usage

Buttons tell users what actions they can take and give them a way to interact with the interface. You’ll find them throughout a UI, particularly in places like:

- Modals
- Forms
- Toolbars

### Best practices

Buttons should:

- **Be clearly and accurately labeled.**
- **Clearly communicate that clicking or tapping will trigger an action.**
- **Use established colors appropriately.** For example, only use red buttons for actions that are difficult or impossible to undo.
- **Prioritize the most important actions.** This helps users focus. Too many calls to action on one screen can be confusing, making users unsure what to do next.
- **Have consistent locations in the interface.**

### Content guidelines

Buttons should be clear and predictable—users should be able to anticipate what will happen when they click a button. Never deceive a user by mislabeling a button.

Buttons text should lead with a strong verb that encourages action, and add a noun that clarifies what will actually change. The only exceptions are common actions like Save, Close, Cancel, or OK. Otherwise, use the {verb}+{noun} format to ensure that your button gives the user enough information.

Button text should also be quickly scannable — avoid unnecessary words and articles like the, an, or a.

## Development guidelines

### States

The PrimitiveButton has a set of special states depending on the platform.

Name  | Description | Platfrom
--- | --- | ---
`disabled` / `enabled` | Determines whether the button is interactive | web/mobile
`focus` | Focused state communicates when a user has highlighted an element using a keyboard or voice. | web/mobile
`hover` | Hover state is initiated by the user pausing over an interactive element using a cursor. | web
`active` | Active state represents an element that is being activated by the user - starts when the user presses down the primary mouse button. | web


### Props

Props not included in this set will be applied to the `button` element.

Name | Type | Default | Description
--- | --- | --- | ---
`disabled` | `bool` | `false` | Whether the button is disabled.
`focus` | `bool` | `false` | Whether the button is focused.
`additionalStyles` | `Array` | `[]` | Additional styles for different states

In addition, the PrimitiveButton uses the [`styled-system`](https://styled-system.com/) that allows styling the component by props. Please check https://styled-system.com/api to see list of all supported props.

### additionalStyles prop
Since we do not expose the CSS prop, there is no possibility to set styles for a particular state like `hover` etc. It can be done by setting the `className` and set styles in css manner or by using `additionalStyles` prop.

The `additionalStyles` prop:
- Allows style customizations for each state
- Allows combining the states

It has to be an `Array` that contains records with styles for particular or mixed states. Every record needs the `states` key, where the value is a string with the state or mixed states concatenated by "`:`" i.e `hover`, `hover:focus:enabled` and the `styles` key with an `Object` value that includes styles that should be aplied.

example:

```js
[
  {
    states: 'hover',
    styles: {
      color: 'yellow',
    },
  },
  {
    states: 'hover:focus',
    styles: {
      color: 'red',
    },
  },
]
```

Keep in mind that not all states are available on mobile, so these ones that are not supported for current platform will be omitted. For example `hover` is invalid for mobile as there’s no cursor so it will have no impact on mobile app.


### Usage

**Renders a default button w/o any styles.**

```jsx
import { PrimitiveButton } from "@wordpress/primitives";

const MyButton = () => (
  <Button>
    Click me!
  </Button>
);

```

**Renders button with styled-system props.**

```jsx
import { PrimitiveButton } from "@wordpress/primitives";

const MyButton = () => (
  <Button
    bg="#FF00FF"
    color="#FFFFFF"
    margin={4}
    padding={8}
  >
    Click me!
  </Button>
);

```

**Renders button with styles for different states.**

```jsx
import { PrimitiveButton } from "@wordpress/primitives";

const additionalStyles = [
  {
    states: 'hover',
    styles: {
      'text-decoration': 'underline',
      cursor: 'pointer',
      color: 'yellow',
    },
  },
  {
    states: 'focus',
    styles: {
      outline: 'none',
      'outline-offset': '-2px',
      'box-shadow': 'none',
    },
  },
  {
    states: 'focus:hover',
    styles: {
      'text-decoration': 'underline',
      cursor: 'pointer',
      color: 'green',
    },
  },
  {
    states: 'disabled',
    styles: {
      background: '#AAAAAA'
    }
  }
]

const MyButton = () => (
  <Button
    bg="#FF00FF"
    color="#FFFFFF"
    margin={4}
    padding={8}
    additionalStyles={additionalStyles}
  >
    Click me!
  </Button>
);

```

