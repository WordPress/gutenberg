# `Navigator.Screen`

The `Navigator.Screen` component represents a single view/screen/panel and should be used in combination with the [`Navigator`](/packages/components/src/navigator/navigator/README.md), the [`Navigator.Button`](/packages/components/src/navigator/navigator-button/README.md) and the [`Navigator.BackButton`](/packages/components/src/navigator/navigator-back-button/README.md) components, and the `useNavigator` hook.

## Usage

Refer to [the `Navigator` component](/packages/components/src/navigator/navigator/README.md#usage) for a usage example.

## Props

The component accepts the following props:

### `path`: `string`

The screen&quot;s path, matched against the current path stored in the navigator.

`Navigator` assumes that screens are organized hierarchically according to their `path`, which should follow a URL-like scheme where each path segment starts with and is separated by the `/` character.

`Navigator` will treat "back" navigations as going to the parent screen — it is therefore responsibility of the consumer of the component to create the correct screen hierarchy.

For example:

-   `/` is the root of all paths. There should always be a screen with `path="/"`.
-   `/parent/child` is a child of `/parent`.
-   `/parent/child/grand-child` is a child of `/parent/child`.
-   `/parent/:param` is a child of `/parent` as well.
-   if the current screen has a `path` with value `/parent/child/grand-child`, when going "back" `Navigator` will try to recursively navigate the path hierarchy until a matching screen (or the root `/`) is found.

-   Required: Yes
