# Page attributes input components

Here components that provide the functionality available in `Page Attributes` panel of the document sidebar are documented.
Using these components, one can add a UI that allows changing page attributes in different scenarios/needs.

## PageAttributesCheck

This component is used to check if the page attributes section should be rendered or not.

The page attributes section is rendered if the post type of the current post being edited supports `page-attributes` or if some templates are available and could be used on the current post.

If the check returns `true` the children passed to this component are rendered.
If the check returns `false` nothing is rendered.

### Props

The component accepts no props besides the children.

## PageAttributesOrder

This component is used to render an input field that allows changing the order property of a post.

### Props

The component accepts no props at all, the current order is retrieved by the component from the editor state, and when a change occurs, the component is responsible for dispatching the change to the state.

## PageAttributesParent

This component is used to render a select control that allows choosing the parent of a given post.

### Props

The component queries most of the information it needs from the state and is able to directly update the editor state when a change occurs.

#### items

An array of post objects (as returned from the rest API) that may be possible parents of the current post being edited.

The only fields of the post object that the component needs and uses are id, parent and title.

If the prop is not passed the component queries the rest API to list published posts of the same post type.


- Type: `Array`
- Required: No


## PageTemplate

This component is used to render a select control that allows choosing the template of a given post.

### Props

The component accepts no props at all, the current template is retrieved by the component from the editor state and when a change occurs the component is responsible for dispatching the change to the state.



## Example usage of the components

By default only published posts are allowed to be parents of other posts. In the following sample, we implement a plugin that re-implements a page attributes sidebar where any post can be select as a parent of the post being edited. The plugin also removes the default page attributes panel.

```js
( function() {
	var PanelBody = wp.components.PanelBody;
	var PanelRow = wp.components.PanelRow;
	var withSelect = wp.data.withSelect;
	var dispatch = wp.data.dispatch;
	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var PluginSidebarMoreMenuItem = wp.editPost.PluginSidebarMoreMenuItem;

	var PageAttributesCheck = wp.editor.PageAttributesCheck;
	var PageTemplate = wp.editor.PageTemplate;
	var PageAttributesParent = wp.editor.PageAttributesParent;
	var PageAttributesOrder = wp.editor.PageAttributesOrder;

	function SidebarContents( props ) {
		return el(
			PanelBody,
			{},
			el(
				PageTemplate,
			),
			el(
				PageAttributesParent,
				{
					items: props.parentItems,
				}
			),
			el(
				PanelRow,
				{},
				el(
					PageAttributesOrder,
				)
			)
		);
	}

	var SidebarContentsWithDataHandling = withSelect( function( select ) {
		var selectCore = select( 'core' );
		var selectEditor = select( 'core/editor' );

		var postTypeSlug = selectEditor.getEditedPostAttribute( 'type' );
		var postType = selectCore.getPostType( postTypeSlug );
		var postId = selectEditor.getCurrentPostId();
		var isHierarchical = postType && postType.hierarchical;
		var query = {
			per_page: -1,
			exclude: postId,
			parent_exclude: postId,
			orderby: 'menu_order',
			order: 'asc',
			status: 'publish,future,draft,pending,private',
		};
		return {
			parentItems: isHierarchical ?
				selectCore.getEntityRecords( 'postType', postTypeSlug, query ) :
				[]
		};
	} )( SidebarContents );

	function CustomPageAttributesPlugin() {
		return el(
			PageAttributesCheck,
			{},
			el(
				PluginSidebar,
				{
					name: 'page-attributes',
					title: __( 'Page Attributes' ),
				},
				el(
					SidebarContentsWithDataHandling,
					{}
				)
			),
			el(
				PluginSidebarMoreMenuItem,
				{
					target: 'page-page'
				},
				__( 'Page Attributes' )
			)
		);
	}

	// Register a plugin that adds a custom sidebar to deal with page attributes.
	registerPlugin( 'my-page-attributes-plugin', {
		icon: 'text',
		render: CustomPageAttributesPlugin
	} );

	// Remove the default page attributes panel.
	dispatch( 'core/edit-post' ).removeEditorPanel( 'page-attributes' );
} )();
```
