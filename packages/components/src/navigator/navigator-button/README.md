# `Navigator.Button`

The `Navigator.Button` component can be used to navigate to a screen and should be used in combination with the [`Navigator`](/packages/components/src/navigator/navigator/README.md), the [`Navigator.Screen`](/packages/components/src/navigator/navigator-screen/README.md) and the [`Navigator.BackButton`](/packages/components/src/navigator/navigator-back-button/README.md) components, and the `useNavigator` hook.

## Usage

Refer to [the `Navigator` component](/packages/components/src/navigator/navigator/README.md#usage) for a usage example.

## Props

The component accepts the following props:

### `attributeName`: `string`

The HTML attribute used to identify the `NavigatorButton`, which is used by `Navigator` to restore focus.

-   Required: No
-   Default: `id`

### `onClick`: `React.MouseEventHandler< HTMLElement >`

The callback called in response to a `click` event.

-   Required: No

### `path`: `string`

The path of the screen to navigate to. The value of this prop needs to be [a valid value for an HTML attribute](https://html.spec.whatwg.org/multipage/syntax.html#attributes-2).

-   Required: Yes

### Inherited props

`NavigatorButton` also inherits all of the [`Button` props](/packages/components/src/button/README.md#props), except for `href` and `target`.
