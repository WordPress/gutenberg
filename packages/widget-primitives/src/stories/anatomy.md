# Anatomy of a widget type

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A widget type is a blueprint: the metadata and modules that describe one kind of widget, independent of any place it is rendered. Everything that blueprint declares falls into three layers. What separates them is not the subject matter but how much freedom the host has over each one.

Naming the layers settles a recurring confusion between what a widget says it _is_, how it _asks_ to be framed, and what it _shows_. Most disagreements about the contract ("should a widget define its own size? its own title?") dissolve once a property is placed in the right layer.

![The three layers a widget declares and how the host treats each: identity is copied and shown verbatim, framing is translated, representation is rendered and mounted without interpretation. What separates them is how much freedom the host has.](./assets/three-layers.svg)

## Identity

What the widget is: `name`, `title`, `description`, `icon`, `category`, `keywords`.

The host shows this almost verbatim, in pickers, headers, and help. It decides _where_ identity appears and _whether_ to show it, never _what it says_. Identity is copied, not interpreted: two hosts displaying the same widget show the same title.

## Framing

How the widget asks to sit in the host's frame. Today this layer holds one property, `presentation`; a size hint is under discussion.

`presentation` suggests how much chrome the widget wants around it. The widget speaks in its own vocabulary ("render me without a frame"); the host decides how to materialize it. Its three values are one axis, from the most chrome to none.

`framed` (the default): the host paints the header from identity and pads the content. Site Health renders inside that frame.

![In framed, the host reads the widget's identity into the chrome header and pads its content. Shown with Site Health.](./assets/presentation-framed.svg)

`content-bleed`: the header stays, but the content fills its area edge to edge, with no padding. Quick Draft uses it.

![In content-bleed, the host still paints the identity header while the widget's content fills its area with no padding. Shown with Quick Draft.](./assets/presentation-content-bleed.svg)

`full-bleed`: no visible header; the widget owns the whole tile. The dashboard, the host shipping today, keeps the identity it did not paint in a VisuallyHidden node, so assistive tech still names the tile. Welcome uses it.

![In full-bleed, the widget owns the tile edge to edge while the host keeps the identity header in a VisuallyHidden node for accessibility. Shown with Welcome.](./assets/presentation-full-bleed.svg)

This is the only layer that is translated, and the only one where the same declaration yields different results in different hosts. The dashboard makes these calls; another host could honor the same three values differently.

## Representation

How the widget represents its data: `attributes`, `example`, and the render module.

The `attributes` are the contract between host and widget. The widget owns their shape and meaning; the host owns their values.

A value can change from either side, and changing one changes what the widget renders. The widget can ask, when the host grants it `setAttributes` (optional: without it the widget renders read-only). The host can also edit values on its own, mounting a settings form from the `attributes` schema. Both paths write the same instance state.

Either way the host never interprets the meaning. It mounts the form straight from the declarative schema, with no idea what a field means. It stores, passes, and re-renders; the meaning stays the widget's.

![The attributes are a contract both sides write: the render module reads them to produce the output, the widget asks for changes through setAttributes, and the host edits them through a settings form. The meaning stays the widget's.](./assets/representation.svg)

The `WidgetRender` stories show both: Default, where the widget asks, and With Settings, where the host edits.

## Why the split matters

The three verbs are the point: identity is _copied_, framing is _translated_, representation is _rendered_. The boundary each layer draws is a boundary of ownership.

A widget does not declare its own header, because the header is host chrome, not something the widget owns. A widget does not declare a width in pixels, because pixels belong to the host's translation of framing, not to the framing itself. Both questions look like they are about the widget; the layer model shows they are about the host.

The same separation is what makes a widget portable. Only the framing layer is re-translated when the host changes; identity and representation are consumed the same way everywhere. A host is free to render a widget in a context its author never anticipated, as long as it honors the three layers for what they are.
