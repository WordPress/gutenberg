# Legacy Widget

The Legacy Widget block allows users to use a WordPress widget as if it were a
block. Notably, it is used by the Widgets block editor screen to allow adding
and editing widgets using the block editor.

## Multi widgets

Your typical Legacy Widget block looks like this:

```
<!-- wp:legacy-widget {"idBase": "search", "instance": {} /-->
```

This will output a search widget with a title.

`idBase` is the "base ID" of the widget. It corresponds to what the widget sets
`WP_Widget::$id_base` to when it is registered.

`instance` contains the widget's settings. These settings are ultimately passed
to `WP_Widget::widget`. Because widget settings can contain **any** PHP value,
including values that have no representation in JSON, the instance settings are
represented using a base64 encoded string in `instance.encoded`. A hash of this
data in `instance.hash` verifies that the data has not been tampered with.

If a widget has set `WP_Widget::$show_instance_in_rest` to `true`, then its raw
unencoded settings are kept in `instance.raw`. This is useful for transforming a
Legacy Widget block into e.g. a Search block.

## Single widgets

WordPress supports a legacy style of widget that does not extend `WP_Widget`.
These are registered using `wp_register_sidebar_widget()`. Widgets registered
this way do not support being inserted multiple times. That is, there can only
be one widget of this type per website.

For these widgets, the Legacy Widget block looks like this:

```
<!-- wp:legacy-widget {"id":"my_widget"} /-->
```

Note that, in this case, there is no `instance` attribute. All data handling is
done by the widget via form submission. No state is stored in the block editor,
which means that, for example, pressing Undo and Redo will have no effect on
changes made to a single widget.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
