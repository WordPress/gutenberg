# Policy

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The engine knows which operations a user can perform on a dashboard: enter customize mode, insert a widget type, and, in time, remove, move, resize, or edit an instance. It does not know who the user is or what the application allows. `WidgetDashboard.Policy` is the seam through which the application answers.

![The engine asks one question per operation, through a request that names the operation and its subject. The application, which owns the permission model, answers through the policy seam with a single callback. The engine resolves that answer once and every surface follows it: the Customize button, the command palette, the inserter. Widgets are never asked. Without a policy, every operation is allowed.](./assets/policy-seam.svg)

## One question, one place

`canPerform( request )` answers whether an operation is allowed. The request names the operation and carries its subject, so a branch on `request.operation` narrows the rest of the object.

```ts
type DashboardOperationRequest =
	| { operation: 'customize' }
	| { operation: 'insert'; widgetType: WidgetType };
```

The engine resolves the policy once, in its provider, and every surface asks that resolved answer. The Customize button, the command palette entries, and the inserter never read the provider themselves, so further sources of policy join at the same point without touching the surfaces.

## The operations

| Operation   | Subject      | What it gates                                                                                                                                                |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `customize` | none         | The Customize button, the `core/dashboard/customize` command, the `core/dashboard/add-widgets` command outside edit mode, and the automatic entry into customize mode on an empty layout. |
| `insert`    | `widgetType` | Whether the inserter offers the type. A rejected type stays out of the listing but keeps rendering where already placed.                                     |

The vocabulary grows with what the engine enforces. Return `true` for operations you do not govern: policies compose restrictively, so a default `false` would deny every operation added later.

## Composition

The provider mounts around `<WidgetDashboard>`, not inside it: the engine mounts the inserter outside the `children` subtree, so a policy placed inside `children` has no effect. One provider can cover several dashboards; one dashboard can have its own.

Nested policies only narrow. An operation is allowed when every enclosing policy allows it; an inner policy cannot re-grant what an outer one denied. Without a policy, every operation is allowed.

This is the opposite of the host's capabilities, deliberately: `WidgetHostProvider` merges over what it inherits, because abilities accumulate; the policy ANDs, because permissions only narrow.

## What it is not

-   **Not `editMode`.** That is a mode the consumer owns, on or off. The policy decides whether the user may enter it.
-   **Not the widget's permissions.** A widget asks the server about its own entities, through core-data, and reflects the answer. The policy never reaches widget bodies: a widget reads the application's decisions only as the presence or absence of what the host lends it.
-   **Not security.** The policy decides what the dashboard offers, not what the server accepts. A host that must enforce permissions does so where the layout persists.

## Providing it

The callback closes over application state and is called during render, so keep it synchronous and memoize it when it derives from state. A new function re-evaluates the dashboard, even with the inserter open.

```tsx
const canPerform = useMemo< CanPerformDashboardOperation >(
	() => ( request ) => {
		switch ( request.operation ) {
			case 'customize':
				return canEditLayout;
			case 'insert':
				return request.widgetType.category === activeSection;
			default:
				return true;
		}
	},
	[ canEditLayout, activeSection ]
);

<WidgetDashboard.Policy canPerform={ canPerform }>
	<WidgetDashboard { ...props } />
</WidgetDashboard.Policy>;
```

See the _Policy_ story in the Playground for a section-scoped dashboard composed inside an admin `Page`.
