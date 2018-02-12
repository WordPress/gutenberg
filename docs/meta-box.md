# Meta Boxes

This is a brief document detailing how meta box support works in Gutenberg. With the superior developer and user experience of blocks however, especially once block templates are available, **converting PHP meta boxes to blocks is highly encouraged!**

### Testing, Converting, and Maintaining Existing Meta Boxes

Before converting meta boxes to blocks, it may be  easier to test if a meta box works with Gutenberg, and explicitly mark it as such.

If a meta box *doesn't* work with in Gutenberg, and updating it to work correctly is not an option, the next step is to add the `__block_editor_compatible_meta_box` argument to the meta box declaration:

```php
add_meta_box( 'my-meta-box', 'My Meta Box', 'my_meta_box_callback',
	null, 'normal', 'high',
	array(
		'__block_editor_compatible_meta_box' => false,
	)
);
```

This will cause WordPress to fall back to the Classic editor, where the meta box will continue working as before.

Explicitly setting `__block_editor_compatible_meta_box` to `true` will cause WordPress to stay in Gutenberg (assuming another meta box doesn't cause a fallback, of course).

After a meta box is converted to a block, it can be declared as existing for backwards compatibility:

```php
add_meta_box( 'my-meta-box', 'My Meta Box', 'my_meta_box_callback',
	null, 'normal', 'high',
	array(
		'__back_compat_meta_box' => false,
	)
);
```

When Gutenberg is run, this meta box will no longer be displayed in the meta box area, as it now only exists for backwards compatibility purposes. It will continue to be displayed correctly in the Classic editor, should some other meta box cause a fallback.

### Meta Box Data Collection

On each Gutenberg page load, we register an action that collects the meta box data to determine if an area is empty. The original global state is reset upon collection of meta box data.

See `lib/register.php gutenberg_trick_plugins_into_registering_meta_boxes()`

`gutenberg_collect_meta_box_data()` is hooked in later on `admin_head`. It will run through the functions and hooks that `post.php` runs to register meta boxes; namely `add_meta_boxes`, `add_meta_boxes_{$post->post_type}`, and `do_meta_boxes`.

A copy of the global `$wp_meta_boxes` is made then filtered through `apply_filters( 'filter_gutenberg_meta_boxes', $_meta_boxes_copy );`, which will strip out any core meta boxes, standard custom taxonomy meta boxes, and any meta boxes that have declared themselves as only existing for backwards compatibility purposes.

Then each location for this particular type of meta box is checked for whether it is active. If it is not empty a value of true is stored, if it is empty a value of false is stored. This meta box location data is then dispatched by the editor Redux store in `INITIALIZE_META_BOX_STATE`.

Ideally, this could be done at instantiation of the editor and help simplify this flow. However, it is not possible to know the meta box state before `admin_enqueue_scripts`, where we are calling `initializeEditor()`. This will have to do, unless we want to move `initializeEditor()` to fire in the footer or at some point after `admin_head`. With recent changes to editor bootstrapping this might now be possible. Test with ACF to make sure.

### Redux and React Meta Box Management

When rendering the Gutenberg Page, the metaboxes are rendered to a hidden div `#metaboxes`.

*The Redux store by default will hold all meta boxes as inactive*. When
`INITIALIZE_META_BOX_STATE` comes in, the store will update any active meta box areas by setting the `isActive` flag to `true`. Once this happens React will check for the new props sent in by Redux on the `MetaBox` component. If that `MetaBox` is now active, instead of rendering null, a `MetaBoxArea` component will be rendered. The `MetaBox` component is the container component that mediates between the `MetaBoxArea` and the Redux Store. *If no meta boxes are active, nothing happens. This will be the default behavior, as all core meta boxes have been stripped.*

#### MetaBoxArea Component

When the component renders it will store a ref to the metaboxes container, retrieve the metaboxes HTML from the prefetch location.

When the post is updated, only meta boxes areas that are active will be submitted. This removes any unnecessary requests being made. No extra revisions, are created either by the meta box submissions. A Redux action will trigger on `REQUEST_POST_UPDATE` for any active meta box. See `editor/effects.js`. The `REQUEST_META_BOX_UPDATES` action will set that meta boxes' state to `isUpdating`, the `isUpdating` prop will be sent into the `MetaBoxArea` and cause a form submission.

If the metabox area is saving, we display an updating overlay, to prevent users from changing the form values while the meta box is submitting.

When the new block editor was made into the default editor it is now required to provide the classic-editor flag to access the metabox partial page.

`gutenberg_meta_box_save()` is used to save the meta boxes changes. A `meta_box` request parameter should be present and should match one of `'advanced'`, `'normal'`, or `'side'`. This value will determine which meta box area is served.

So an example url would look like:

`mysite.com/wp-admin/post.php?post=1&action=edit&meta_box=$location&classic-editor`

This url is automatically passed into React via a `_wpMetaBoxUrl` global variable.

Thus page page mimics the `post.php` post form, so when it is submitted it will normally fire all of the necessary hooks and actions, and have the proper global state to correctly fire any PHP meta box mumbo jumbo without needing to modify any existing code. On successful submission, React will signal a `handleMetaBoxReload` to remove the updating overlay, and set the store to no longer be updating the meta box area.


### Common Compatibility Issues

Most PHP meta boxes should continue to work in Gutenberg, however some meta boxes that include advanced functionality could break. The following list describes some of the most common reasons why meta boxes might not work as expected in Gutenberg:

- Plugins relying on selectors that target the post title, post content fields, and other metaboxes (of the old editor).
- Plugins relying on TinyMCE's API because there's no longer a single TinyMCE instance to talk to in Gutenberg.
- Plugins making updates to their DOM on "submit" or on "save".
