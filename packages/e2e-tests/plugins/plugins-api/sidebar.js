( function () {
	const Button = wp.components.Button;
	const PanelBody = wp.components.PanelBody;
	const PanelRow = wp.components.PanelRow;
	const editorStore = wp.editor.store;
	const useDispatch = wp.data.useDispatch;
	const useSelect = wp.data.useSelect;
	const PlainText = wp.blockEditor.PlainText;
	const Fragment = wp.element.Fragment;
	const el = wp.element.createElement;
	const __ = wp.i18n.__;
	const registerPlugin = wp.plugins.registerPlugin;
	const PluginSidebar = wp.editPost.PluginSidebar;
	const PluginSidebarMoreMenuItem = wp.editPost.PluginSidebarMoreMenuItem;

	function SidebarContents() {
		const postTitle = useSelect( ( select ) =>
			select( editorStore ).getEditedPostAttribute( 'title' )
		);
		const editPost = useDispatch( editorStore ).editPost;

		function resetTitle() {
			editPost( { title: '' } );
		}

		function updateTitle( title ) {
			editPost( { title } );
		}

		return el(
			PanelBody,
			{ className: 'sidebar-title-plugin-panel' },
			el(
				PanelRow,
				{},
				el(
					'label',
					{
						htmlFor: 'title-plain-text',
					},
					__( 'Title:' )
				),
				el( PlainText, {
					id: 'title-plain-text',
					onChange: updateTitle,
					placeholder: __( '(no title)' ),
					value: postTitle,
				} )
			),
			el(
				PanelRow,
				{},
				el(
					Button,
					{
						variant: 'primary',
						onClick: resetTitle,
					},
					__( 'Reset' )
				)
			)
		);
	}

	function MySidebarPlugin() {
		return el(
			Fragment,
			{},
			el(
				PluginSidebar,
				{
					name: 'title-sidebar',
					title: __( 'Plugin sidebar title' ),
				},
				el( SidebarContents, {} )
			),
			el(
				PluginSidebarMoreMenuItem,
				{
					target: 'title-sidebar',
				},
				__( 'Plugin sidebar more menu title' )
			)
		);
	}

	registerPlugin( 'my-sidebar-plugin', {
		icon: 'text',
		render: MySidebarPlugin,
	} );
} )();
