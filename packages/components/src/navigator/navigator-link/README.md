# `NavigatorLink`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The `NavigatorLink` component can be used to navigate to a screen and should be used in combination with the [`NavigatorProvider`](/packages/components/src/navigator/navigator-provider/README.md), the [`NavigatorScreen`](/packages/components/src/navigator/navigator-screen/README.md) and the [`NavigatorBackLink`](/packages/components/src/navigator/navigator-back-link/README.md) components (or the `useNavigator` hook).

## Usage

Refer to [the `NavigatorProvider` component](/packages/components/src/navigator/navigator-provider/README.md#usage) for a usage example.

## Props

The component accepts the following props:

### `attributeName`: `string`

The HTML attribute used to identify the `NavigatorLink`, which is used by `Navigator` to restore focus.

-   Required: No
-   Default: `id`

### `onClick`: `React.MouseEventHandler< HTMLElement >`

The callback called in response to a `click` event.

-   Required: No

### `path`: `string`

The path of the screen to navigate to. The value of this prop needs to be [a valid value for an HTML attribute](https://html.spec.whatwg.org/multipage/syntax.html#attributes-2).

-   Required: Yes
