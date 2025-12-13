( function () {
	const Button = wp.components.Button;
	const PanelBody = wp.components.PanelBody;
	const select = wp.data.select;
	const dispatch = wp.data.dispatch;
	const Fragment = wp.element.Fragment;
	const el = wp.element.createElement;
	const { useState } = wp.element;
	const __ = wp.i18n.__;
	const registerPlugin = wp.plugins.registerPlugin;
	const PluginSidebar = wp.editor.PluginSidebar;
	const PluginSidebarMoreMenuItem = wp.editor.PluginSidebarMoreMenuItem;

	function SidebarContents() {
		const [ state, setState ] = useState( { start: 0, end: 0 } );

		return el(
			PanelBody,
			{},
			el( 'input', {
				type: 'number',
				id: 'annotations-tests-range-start',
				onChange: ( reactEvent ) => {
					setState( ( prev ) => ( {
						...prev,
						...{
							start: reactEvent.target.value,
						},
					} ) );
				},
				value: state.start,
			} ),
			el( 'input', {
				type: 'number',
				id: 'annotations-tests-range-end',
				onChange: ( reactEvent ) => {
					setState( ( prev ) => ( {
						...prev,
						...{
							end: reactEvent.target.value,
						},
					} ) );
				},
				value: state.end,
			} ),
			el(
				Button,
				{
					variant: 'primary',
					onClick: () => {
						dispatch(
							'core/annotations'
						).__experimentalAddAnnotation( {
							source: 'e2e-tests',
							blockClientId:
								select(
									'core/block-editor'
								).getBlockOrder()[ 0 ],
							richTextIdentifier: 'content',
							range: {
								start: parseInt( state.start, 10 ),
								end: parseInt( state.end, 10 ),
							},
						} );
					},
				},
				__( 'Add annotation' )
			),
			el(
				Button,
				{
					variant: 'primary',
					onClick: () => {
						dispatch(
							'core/annotations'
						).__experimentalRemoveAnnotationsBySource(
							'e2e-tests'
						);
					},
				},

				__( 'Remove annotations' )
			)
		);
	}

	function AnnotationsSidebar() {
		return el(
			Fragment,
			{},
			el(
				PluginSidebar,
				{
					name: 'annotations-sidebar',
					title: __( 'Annotations' ),
				},
				el( SidebarContents, {} )
			),
			el(
				PluginSidebarMoreMenuItem,
				{
					target: 'annotations-sidebar',
				},
				__( 'Annotations' )
			)
		);
	}

	registerPlugin( 'annotations-sidebar', {
		icon: 'text',
		render: AnnotationsSidebar,
	} );
} )();
