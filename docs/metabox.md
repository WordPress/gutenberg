# Metaboxes

This is a brief document detailing how metabox support works in Gutenberg. With
the superior developer and user experience of blocks however, especially once,
block templates are available, **converting PHP metaboxes to blocks is highly
encouraged!**

## Breakdown

Each metabox area is rendered by a React component containing an iframe.
Each iframe will render a partial page containing only metaboxes for that area.
Metabox data is collected and used for conditional rendering.

### Metabox Data Collection

On each Gutenberg page load, the global state of post.php is mimicked, this is
hooked in as far back as `plugins_loaded`.

See `lib/register.php gutenberg_trick_plugins_into_registering_metaboxes()`

This will register two new actions, one that fakes the global post state, and
one that collects the metabox data to determine if an area is empty.

gutenberg_set_post_state() is hooked in early on admin_head to fake the post
state. This is necessary for ACF to work, no other metabox frameworks seem to
have this problem. ACF will grab the `$post->post_type` to determine whether a
box should be registered. Later in `admin_head` ACF will register the metaboxes.

Hooked in later on admin_head is gutenberg_collect_metabox_data(), this will
run through the functions and hooks that post.php runs to register metaboxes;
namely `add_meta_boxes, add_meta_boxes_{$post->post_type}`, and `do_meta_boxes`.

A copy of the global $wp_meta_boxes is made then filtered through
`apply_filters( 'filter_gutenberg_metaboxes', $_metaboxes_copy );`, which will
strip out any core metaboxes along with standard custom taxonomy metaboxes.

Then each location for this particular type of metabox is checked for whether it
is active. If it is not empty a value of true is stored, if it is empty a value
of false is stored. This metabox location data is then dispatched by the editor
Redux store in `INITIALIZE_METABOX_STATE`.

Ideally, this could be done at instantiation of the editor, and help simplify,
this flow. However, it is not possible to know the metabox state before
`admin_enqueue_scripts` where we are calling `createEditorInstance()`. This will
have to do.

### Redux and React Metabox Management.

*The Redux store by default will hold all metaboxes as inactive*. When
`INITIALIZE_METABOX_STATE` comes in, the store will update any active metabox
areas by setting the `isActive` flag to `true`. Once this happens React will
check for the new props sent in by Redux on the Metabox component. If that
Metabox is now active, instead of rendering null, a MetaboxIframe component will
be rendered. The Metabox component is the container component that mediates
between the MetaboxIframe and the Redux Store. *If no metaboxes are active,
nothing happens. This will be the default behavior, as all core metaboxes have
been stripped.*

#### MetaboxIframe Component

When the component renders it will store a ref to the iframe, the component will
set up a listener for post messages for resizing. assets/js/metabox.js is
loaded inside the iframe and will send up postMessages for resizing, which the
MetaboxIframe Component will use to manage its state. A mutation observer will
also be created when the iframe loads. The observer will detect whether, any
DOM changes have happened in the iframe, input and change event listeners will
also be attached to check for changes.

The change detection will store the current form's `FormData`, then whenever a
change is detected the current form data will be checked vs, the original form
data. This serves as a way to see if the metabox state is dirty. When the
metabox state has been detected to have changed, a Redux action
`METABOX_STATE_CHANGED` is dispatched, updating the store setting the isDirty
flag to `true`. If the state ever returns back to the original form data,
`METABOX_STATE_CHANGED` is dispatched again to set the isDirty flag to `false`.
A selector `isMetaboxStateDirty()` is used to help check whether the post can be
updated. It checks each metabox for whether it is dirty, and if there is at
least one dirty metabox, it will return true. This dirty detection does not
impact creating new posts, as the content will have to change before metaboxes
can trigger the overall dirty state.

When the post is updated, only metaboxes that are active and dirty, will be
submitted. This removes any unnecessary requests being made. No extra revisions,
are created either by the metabox submissions. A redux action will trigger on
`REQUEST_POST_UPDATE` for any dirty metabox. See editor/effects.js. The
`REQUEST_METABOX_UPDATE` action will set that metabox's state to isUpdating,
the isUpdating prop will be sent into the MetaboxIframe and cause a form
submission. After loading, the original change detection process is fired again
to handle the new state. Double buffering the iframes here will improve the
user experience quite a bit, as there currently is a flicker.

### Iframe serving a partial page.

Each iframe will point to an individual source. These are partial pages being
served by post.php. Why this approach? By using post.php directly, we don't have
to worry as much about getting the global state 100% correct for each and every
use case of a metabox, especially when it comes to saving. Essentially, when
post.php loads it will set up all of its state correctly, and when it hits the
three `do_action( 'do_meta_boxes' )` hooks it will trigger our partial page.

`gutenberg_metabox_partial_page()` is used to render the metaboxes for a context
then exit the execution thread early. A `metabox` request parameter is used to
trigger this early exit. The metabox request parameter should match one of
`'advanced'`, `'normal'`, or `'side'`. This value will determine which metabox
area is served. So an example url would look like:

`mysite.com/wp-admin/post.php?post=1&action=edit&metabox=$location`

This url is automatically passed into React via a _wpMetaboxUrl global variable.
The partial page is very similar to post.php and pretty much imitates it and
after rendering the metaboxes via do_meta_boxes() it exits early and does some
hook clean up. There are two extra files that are enqueued; both with a handle
metabox-gutenberg. One is the js file from assets/js/metabox.js, which resizes
the iframe. The stylesheet is generated by webpack from
editor/metaboxes/metabox-iframe.scss and built
into editor/build/metabox-iframe.css

These styles make use of some of the SASS variables, so that as the Gutenberg
UI updates so will the Metaboxes.

The partial page mimics the post.php post form, so when it is submitted it will
normally fire all of the necessary hooks and actions, and have the proper global
state to correctly fire any PHP metabox mumbo jumbo without needing to modify
any existing code. On successful submission the page will be reloaded back to
the same partial page with updated data.

## Wrap Up.

There are some other details I am probably forgetting but this is a pretty good
overview.
