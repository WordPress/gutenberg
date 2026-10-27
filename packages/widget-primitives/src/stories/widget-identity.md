# Widget identity

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A widget type's identity — `title`, and the rest of the identity layer in **Anatomy** — lives on `WidgetType`. The host already shows the translated title in its chrome. The render body sometimes needs that same string: a focusable chart whose accessible name should say what it shows, in the user's language.

`useWidgetIdentity` is that channel. It is not a host capability.

![WidgetRender holds the resolved WidgetType, including its translated title. It mounts the render module with attributes and setAttributes, and lends the subtree a filtered identity context. The widget body reads useWidgetIdentity for the title to build an accessible name. Host capabilities such as links stay on a separate seam.](./assets/widget-identity-flow.svg)

## Why a separate channel

Three concerns, three APIs:

-   Instance state: `attributes` / `setAttributes` on the render contract.
-   Host materialization: `useWidgetHost` for what only the host or application can provide (`links`, `actions`). See **Widget Host**.
-   Type identity for the body: `useWidgetIdentity` for the filtered slice of the type the render may need.

Putting `title` on `WidgetHost` would mix the type's own metadata with capabilities the host originates. Passing the whole `WidgetType` as render props would couple the body to chrome and schema fields it should not own. Reading a WordPress entity store from the render would couple portable widgets to one host's discovery path.

## Contract

```ts
type WidgetIdentity = {
	title?: string;
};
```

`title` is the translated title of the widget type, as the host already shows it. Absent identity (no provider) yields `{}`; the widget names its content itself.

The public surface is the hook and this type. The provider is an internal detail of `WidgetRender`.

## Providing it

`<WidgetRender>` already receives `widgetType`. When it mounts the render module it lends the subtree `{ title: widgetType.title }`. Any host that mounts through that entry point needs no extra wiring: the dashboard tile, its previews, and Storybook hosts that use `WidgetRender` all get it.

A host that mounts a render module directly, without `WidgetRender`, leaves identity absent. That is the same degradation pattern as an absent host capability.

## Consuming it

```tsx
const { title } = useWidgetIdentity();
const name = title
	? sprintf(
			/* translators: %s: widget title */
			__( 'Chart: %s' ),
			title
	  )
	: undefined;

return <figure aria-label={ name } />;
```

How a widget phrases a name around the title belongs to that widget and its translators. Prefer a format that does not assume word order when the locale can put the noun first; a colon-separated label is one such pattern.

Guard `title`: without a provider it is `undefined`.
