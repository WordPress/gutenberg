# `NavigatorBackButton`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The `NavigatorBackButton` component can be used to navigate to a screen and should be used in combination with the [`NavigatorProvider`](/packages/components/src/navigator/navigator-provider/README.md), the [`NavigatorScreen`](/packages/components/src/navigator/navigator-screen/README.md) and the [`NavigatorButton`](/packages/components/src/navigator/navigator-button/README.md) components (or the `useNavigator` hook).

## Usage

Refer to [the `NavigatorProvider` component](/packages/components/src/navigator/navigator-provider/README.md#usage) for a usage example.

## Props

The component accepts the following props:

### `onClick`: `React.MouseEventHandler< HTMLElement >`

The callback called in response to a `click` event.

-   Required: No

### `path`: `string`

The path of the screen to navigate to.

-   Required: Yes

### Inherited props

`NavigatorBackButton` also inherits all of the [`Button` props](/packages/components/src/button/README.md#props), except for `href`.
