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
	const PluginSidebar = wp.editor.PluginSidebar;
	const PluginSidebarMoreMenuItem = wp.editor.PluginSidebarMoreMenuItem;

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
					title: __( 'Plugin title' ),
				},
				el( SidebarContents, {} )
			),
			el(
				PluginSidebarMoreMenuItem,
				{
					target: 'title-sidebar',
				},
				__( 'Plugin more menu title' )
			)
		);
	}

	registerPlugin( 'my-sidebar-plugin', {
		icon: 'text',
		render: MySidebarPlugin,
	} );

	// A pinnable sidebar without a PluginSidebarMoreMenuItem of its own, so the
	// only More Menu item for it is the one PluginSidebar injects.
	function MyInjectedItemSidebarPlugin() {
		return el(
			PluginSidebar,
			{
				name: 'injected-item-sidebar',
				title: __( 'Injected menu item' ),
			},
			el( PanelBody, {}, __( 'Injected menu item content' ) )
		);
	}

	registerPlugin( 'my-injected-item-sidebar-plugin', {
		icon: 'text',
		render: MyInjectedItemSidebarPlugin,
	} );
} )();
