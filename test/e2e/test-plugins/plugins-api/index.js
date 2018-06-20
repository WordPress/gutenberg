var Button = wp.components.Button;
var PanelBody = wp.components.PanelBody;
var PanelRow = wp.components.PanelRow;
var withDispatch = wp.data.withDispatch;
var withSelect = wp.data.withSelect;
var Fragment = wp.element.Fragment;
var compose = wp.element.compose;
var el = wp.element.createElement;
var __ = wp.i18n.__;
var registerPlugin = wp.plugins.registerPlugin;
var PluginSidebar = wp.editPost.PluginSidebar;
var PluginSidebarMoreMenuItem = wp.editPost.PluginSidebarMoreMenuItem;

function SidebarContents( props ) {
	var noTitle = el(
		'em',
		{},
		__( '(No title)' )
	);
	return (
		el(
			PanelBody,
			{},
			el(
				PanelRow,
				{},
				props.title || noTitle
			),
			el(
				PanelRow,
				{},
				el(
					Button,
					{ isPrimary: true, onClick: props.onReset },
					__( 'Reset' )
				)
			)
		)
	);
}

var SidebarContentsWithDataHandling = compose( [
	withSelect( function( select ) {
		return {
			title: select( 'core/editor' ).getEditedPostAttribute( 'title' ),
		};
	} ),
	withDispatch( function( dispatch ) {
		return {
			onReset: function() {
				dispatch( 'core/editor' ).editPost( {
					title: ''
				} );
			}
		};
	} )
] )( SidebarContents );

function MyTitlePlugin() {
	return (
		el(
			Fragment,
			{},
			el(
				PluginSidebar,
				{
					name: 'my-title-sidebar',
					title: 'My title plugin'
				},
				el(
					SidebarContentsWithDataHandling,
					{}
				)
			),
			el(
				PluginSidebarMoreMenuItem,
				{
					target: 'my-title-sidebar'
				},
				__( 'My title plugin' )
			)
		)
	);
}

registerPlugin( 'my-title-plugin', {
	icon: 'welcome-write-blog',
	render: MyTitlePlugin
} );
