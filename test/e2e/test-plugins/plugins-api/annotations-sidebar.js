( function() {
	var Button = wp.components.Button;
	var PanelBody = wp.components.PanelBody;
	var PanelRow = wp.components.PanelRow;
	var compose = wp.compose.compose;
	var withDispatch = wp.data.withDispatch;
	var withSelect = wp.data.withSelect;
	var select = wp.data.select;
	var dispatch = wp.data.dispatch;
	var PlainText = wp.editor.PlainText;
	var Fragment = wp.element.Fragment;
	var el = wp.element.createElement;
	var Component = wp.element.Component;
	var __ = wp.i18n.__;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var PluginSidebarMoreMenuItem = wp.editPost.PluginSidebarMoreMenuItem;

	class SidebarContents extends Component {
		constructor( props ) {
			super( props );

			this.state = {
				start: 0,
				end: 0,
			}
		}

		render() {
			return el(
				PanelBody,
				{},
				el(
					'input',
					{
						type: 'number',
						id: 'annotations-tests-range-start',
						onChange: ( reactEvent ) => {
							this.setState( {
								start: reactEvent.target.value,
							} );
						},
						value: this.state.start,
					}
				),
				el(
					'input',
					{
						type: 'number',
						id: 'annotations-tests-range-end',
						onChange: ( reactEvent ) => {
							this.setState( {
								end: reactEvent.target.value,
							} );
						},
						value: this.state.end,
					}
				),
				el(
					Button,
					{
						isPrimary: true,
						onClick: () => {
							dispatch( 'core/annotations' ).__experimentalAddAnnotation( {
								source: 'e2e-tests',
								blockClientId: select( 'core/editor' ).getBlockOrder()[ 0 ],
								richTextIdentifier: 'content',
								range: {
									start: parseInt( this.state.start, 10 ),
									end: parseInt( this.state.end, 10 ),
								},
							} );
						},
					},
					__( 'Add annotation' )
				),
				el(
					Button,
					{
						isPrimary: true,
						onClick: () => {
							dispatch( 'core/annotations' ).__experimentalRemoveAnnotationsBySource( 'e2e-tests' );
						}
					},

					__( 'Remove annotations' )
				)
			);
		}
	}

	function AnnotationsSidebar() {
		return el(
			Fragment,
			{},
			el(
				PluginSidebar,
				{
					name: 'annotations-sidebar',
					title: __( 'Annotations Sidebar' )
				},
				el(
					SidebarContents,
					{}
				)
			),
			el(
				PluginSidebarMoreMenuItem,
				{
					target: 'annotations-sidebar'
				},
				__( 'Annotations Sidebar' )
			)
		);
	}

	registerPlugin( 'annotations-sidebar', {
		icon: 'text',
		render: AnnotationsSidebar
	} );
} )();
