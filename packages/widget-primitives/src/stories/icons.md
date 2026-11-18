# Icons

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

An icon authored as a React element can only travel inside its metadata module, so any surface that wants to draw it has to import and execute the module first. The icon reference makes the declaration travel as data instead: `widget.json` names an icon registered in the site's icon registry, and the name flows through the build manifest, the server registry, and the REST record like every other identity field.

## Referencing

One nullable string field. A registered icon name is `collection/icon-name`:

```json
{ "icon": "core/calendar" }
```

A metadata module may still declare a rendered element; the resolved reference wins over it, and the element stands when the record carries none. The widgets in this repository all declare references.

## Registering the resolver

The reference is data behind a REST entity, so what the application registers is a resolver rather than a value. It registers one resolver, before anything renders, closing over whatever data layer it owns:

```ts
registerIconResolver( async ( reference ) => {
	const icon = await fetchIconRecord( reference );
	return icon ? toElement( icon.content ) : null;
} );
```

The resolver returns a renderable element or `null`. First registration wins.

## Resolution

`useWidgetTypes` resolves references while it assembles each `WidgetType`, at the same boundary that resolves field-type names. Hosts receive a renderable `icon` and never see a reference; anything that is not an element is dropped at the boundary. The _WidgetRender / With Icon Reference_ story shows the seam in isolation.

## When the reference does not resolve

An unregistered name, a missing resolver, or a resolver failure degrades to no icon; the metadata module's element stands when there is one. A widget referencing an icon its application cannot resolve degrades; it does not break.
