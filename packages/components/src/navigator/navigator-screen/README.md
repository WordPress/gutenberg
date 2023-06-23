# `NavigatorScreen`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The `NavigatorScreen` component represents a single view/screen/panel and should be used in combination with the [`NavigatorProvider`](/packages/components/src/navigator/navigator-provider/README.md), the [`NavigatorButton`](/packages/components/src/navigator/navigator-button/README.md) and the [`NavigatorBackButton`](/packages/components/src/navigator/navigator-back-button/README.md) components (or the `useNavigator` hook).

## Usage

Refer to [the `NavigatorProvider` component](/packages/components/src/navigator/navigator-provider/README.md#usage) for a usage example.

## Props

The component accepts the following props:

### `path`: `string`

The screen's path, matched against the current path stored in the navigator.

-   Required: Yes

### `aria-label`: `string`

The id of another element used to label this screen element.

-   Required: Yes (either this prop or the `aria-labelledby` prop should be provided to the component)

### `aria-labelledby`: `string`

The id of another element used to label this screen element.

-   Required: Yes (either this prop or the `aria-label` prop should be provided to the component)

### `role`: `string`

The aria-role attributed to the screen.

-   Required: No
-   Default: `'region'`
