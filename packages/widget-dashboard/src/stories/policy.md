# Policy

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The engine knows which operations a user can perform on a dashboard: enter customize mode, reset the layout to default, insert a widget type, remove, move, resize, or edit an instance. It does not know who the user is or what the application allows. `WidgetDashboard.Policy` is the seam through which the application answers.

![The engine asks one question per operation via a request that names the operation and its subject. The application, which owns the permission model, answers via the policy seam with a single callback. The engine resolves that answer once, and every surface follows it: the Customize button and the command palette, the inserter, the tile controls, the drag and resize gestures. Widgets are never asked; without edit they render read-only. Without a policy, every operation is allowed.](./assets/policy-seam.svg)

## One question, one place

`canPerform( request )` indicates whether an operation is allowed. The request names the operation and carries its subject, so a branch on `request.operation` narrows the rest of the object.

```ts
type DashboardOperationRequest =
	| { operation: 'customize' }
	| { operation: 'reset' }
	| { operation: 'insert'; widgetType: WidgetType }
	| {
			operation: 'remove' | 'move' | 'resize' | 'edit';
			widget: DashboardWidget;
			widgetType?: WidgetType;
	  };
```

The engine resolves the policy once, in its provider, and every surface asks for that resolved answer.

The Customize button, the command palette entries, the tile controls, and the inserter never read the provider itself, so additional policy sources join at the same point without touching the surfaces.

## The operations

| Operation   | Subject                 | What it gates                                                                                                                                                                                     |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customize` | none                    | The Customize button, the `core/dashboard/customize` command, the `core/dashboard/add-widgets` command outside edit mode, and the automatic entry into customize mode on an empty layout.         |
| `reset`     | none                    | The Reset to default entry in the overflow menu, the `core/dashboard/reset-to-default` command, and the confirmation prompt they open. A denied reset is hidden, not disabled.                    |
| `insert`    | `widgetType`            | Whether the inserter offers the type; a rejected type keeps rendering where already placed. The Add widget button and command show only while some registered type is insertable.                 |
| `remove`    | `widget`, `widgetType?` | The Remove control in customize mode. The staging layer re-asserts, in place, a locked instance dropped by any trigger.                                                                           |
| `move`      | `widget`, `widgetType?` | Dragging the tile in customize mode. A denied tile is pinned: it holds its index while the other tiles reorder around it; a change ahead of it can still reflow the cell it lands in.             |
| `resize`    | `widget`, `widgetType?` | The resize handle and the width menu.                                                                                                                                                             |
| `edit`      | `widget`, `widgetType?` | Attribute editing: the inline fields and the settings trigger in the header, the settings surface, and the widget's `setAttributes`, which is absent when denied so the widget renders read-only. |

The vocabulary grows with what the engine enforces. Return `true` for operations you do not govern: policies compose restrictively, so a default `false` would deny every operation added later.

## Composition

The provider mounts around `<WidgetDashboard>`, not inside it.
The engine mounts the inserter outside the `children` subtree, so a policy placed inside `children` has no effect. One provider can cover several dashboards; one dashboard can have its own.

Nested policies only narrow. An operation is allowed only if every enclosing policy allows it; an inner policy cannot re-grant what an outer one denied. Without a policy, every operation is allowed.

This is the opposite of the host's capabilities, deliberately: `WidgetHostProvider` merges what it inherits because abilities accumulate; the policy ANDs because permissions only narrow.

## What it is not

-   **Not `editMode`.** That is a mode the consumer controls, on or off. The policy determines whether the user may enter it.
-   **Not the widget's permissions.** A widget asks the server about its own entities via core-data and reflects the response. The policy never asks the widget anything; the widget only sees one consequence, the same it would see in any read-only host: without `edit`, it receives no `setAttributes`.
-   **Not security.** The policy determines what the dashboard offers, not what the server accepts. A host that must enforce permissions does so where the layout persists.

## Providing it

The callback operates over application state and is called during render, so keep it synchronous and memoize it when it depends on state.

A new function re-evaluates the dashboard, even with the inserter open.

```tsx
const canPerform = useMemo< CanPerformDashboardOperation >(
	() => ( request ) => {
		switch ( request.operation ) {
			case 'customize':
				return canEditLayout;
			case 'insert':
				return request.widgetType.category === activeSection;
			case 'remove':
				return ! request.widget.attributes?.pinned;
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

See the _Policy_ story in the Playground: three user profiles (Viewer, Arranger, Owner) and a section-scoped inserter, composed inside an admin `Page`. The command palette is mounted there as well; press ⌘K to check which commands each profile keeps.
