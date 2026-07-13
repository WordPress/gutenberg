# Field types

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A widget attribute is a DataViews `Field`, and DataViews resolves each field's `type` against a fixed internal list. The only way past that list used to be attaching an `Edit` component to the field, which binds the schema to code: the control cannot be reused by reference, and the attribute cannot stay pure data. Field types make the reference declarative. The application registers what a name means; attributes use the name.

![The application registers the vocabulary once at init; the widget references a type by name; resolveFields, inside useWidgetTypes, is the only point that recognizes the name and translates it into plain DataViews props; DataForm renders the control in the chrome header and the settings surface. Unregistered names pass through and degrade silently.](./assets/field-type-pipeline.svg)

## A `Field` is an instance; a field type is a word

A `Field` describes one attribute of one widget: its `id`, its label, its `relevance`. A field type defines what a `type` name _means_: which control edits it, how it validates, sorts, and formats. Fields are never registered; they travel by value. Field types are registered once and referenced many times.

## Registering

The consuming application owns the vocabulary. It registers each type once, before anything renders.

```ts
registerFieldType( {
	name: 'location',
	baseType: 'text',
	Edit: LocationControl,
} );
```

`name` is any lowercase identifier, plain (`location`) or namespaced (`acme/location`). Resolution is registry-first, so a registered name wins over a DataViews built-in of the same name; prefer names that don't mirror the built-in list. `baseType` names the DataViews type whose built-in behavior (sort, operators, validation semantics) the resolved field inherits; the definition supplies only what differs. First registration wins.

## Referencing

The widget declares the name and nothing else:

```ts
{
	id: 'location',
	type: 'location',
	label: __( 'Event location' ),
	relevance: 'high',
}
```

No imports, no components. The attribute stays pure data, one step away from living in `widget.json`.

## Resolution

`useWidgetTypes` resolves references while it assembles each `WidgetType`: a field referencing a registered name leaves the hook as a plain DataViews field. Its `type` becomes the `baseType`, the definition's props fill the gaps, and the field's own props win. That hook is the only point in the system that recognizes the names; hosts and DataForm downstream see native DataViews vocabulary and nothing else. DataViews itself is never patched.

## When the name is not registered

The field passes through untouched and DataViews treats it as an unknown type, exactly as it does today: the form skips it silently. A widget referencing a vocabulary its host never registered degrades; it does not break.

## Today and later

Resolution currently lives in the widget pipeline, so the vocabulary reaches every surface fed by `useWidgetTypes`: the chrome toolbar, the settings surface, any host consuming `WidgetType`. The translation is deliberately confined to public DataViews `Field` props, so the same mechanism can later move closer to the engine: a DataViews or DataForm that consults registered types natively would make any instance resolve declaratively, with this registry feeding it and no field author changing a line.
