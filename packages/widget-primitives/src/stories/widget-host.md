# Widget host

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A widget renders inside a host, and the host inside an application. Some of what an affordance needs, only the application knows: which router owns a URL, for one. `WidgetHostProvider` and `useWidgetHost` are that seam.

![A widget declares a link action as a portable URL. The host renders the widget and materializes the affordance. The application owns the router and provides the links capability through the seam: match recognizes its own routes, Link is its router's primitive. On a match the host mounts the route link; without the capability the same declaration mounts a plain anchor.](./assets/widget-host-seam.svg)

## Contract

`WidgetHost` is a bag of optional capabilities. An absent capability degrades to the host-agnostic behavior, so consumers guard each one and never assume it exists.

The provider merges its value over the inherited one, so an application can mount a base host once and layer capabilities per subtree. Reading without any provider yields `{}`.

The provider belongs to the application layer, wrapping the dashboard or whatever surface renders widgets. The rendering engine never mounts one for itself, and keeps no dependency on the application's router.

## The `links` capability

```ts
links: {
	match: ( href: string ) => string | null;
	// The router's link primitive. Must render a real anchor and
	// forward `ref` to it. `path` replaces `href`.
	Link: ComponentType<
		{ path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' > &
			RefAttributes< HTMLAnchorElement >
	>;
}
```

`match` answers one question: does this href target one of the application's own routes? On a hit it returns the in-app route, `'/sales?by=day'`, path and query as the router takes them, and the consumer mounts `Link` with it, so the navigation is client-side. On `null` the consumer falls back to a plain anchor.

The action declaration does not change either way. A widget declares the portable URL of its target, `admin.php?page=analytics&p=%2Fsales%3Fby%3Dday`, the route encoded inside `p` with its query; in the owning application that materializes as a router link, everywhere else as a plain anchor that full-loads to the same place. Recognition is the application's: reachability depends on the routes it registered, which change per application and over time.

## Providing it

A route that renders the dashboard supplies its matcher and its router's link. The value's identity drives the provider's memoized merge, so keep it stable: a module constant when it is static, `useMemo` when it derives from component state:

```tsx
const host: WidgetHost = {
	links: { match: matchDashboardHref, Link: RouteLink },
};

<WidgetHostProvider value={ host }>
	<WidgetDashboard { ...props } />
</WidgetHostProvider>;
```

### `Link` and its ref

Consumers compose `Link` into menu items and tooltip triggers through render props, and both reach the anchor through the ref. A link that drops it satisfies the type and fails in use: keyboard navigation skips the menu item, and the tooltip loses its anchor. Under React 18 that means `forwardRef`; under React 19, where `ref` arrives as a prop, spreading the props onto the anchor is enough.

One test pins it for a host's own link:

```tsx
const ref = createRef< HTMLAnchorElement >();
render(
	<RouteLink ref={ ref } path="/reports">
		Reports
	</RouteLink>
);

expect( ref.current ).toBe( screen.getByRole( 'link', { name: 'Reports' } ) );
```

## Consuming it

Most consumers touch the seam here and nowhere else. `HostLink` reads the capability and decides: the host's `Link` on a match, a plain anchor otherwise. A new document never routes, because a router link buys nothing for it, and `HostLink` reads that off the anchor props: a `download` other than `false`, or the `_blank` target a UI link resolves `openInNewTab` into.

It composes through the `render` prop of a UI link, which merges its own anchor props in:

```tsx
<Link
	download={ action.download }
	openInNewTab={ action.openInNewTab }
	render={ <HostLink href={ action.href } /> }
>
	{ action.label }
</Link>
```

`Link`, `LinkButton` and `Menu.LinkItem` take the same anchor props, so one composition serves all three. A consumer that needs the answer before it renders reads `match` itself.

`useWidgetHost` stays available for a capability no component covers yet, or an answer a consumer needs before it renders.

The **WithHostLink** story runs it against a demo router, with a toggle that removes the capability from the host bag.

See the Actions page for the materialization rules this serves: the widget declares where to go, the host decides how to get there.
