( function () {
	const Button = wp.components.Button;
	const PanelBody = wp.components.PanelBody;
	const select = wp.data.select;
	const dispatch = wp.data.dispatch;
	const useSelect = wp.data.useSelect;
	const useDispatch = wp.data.useDispatch;
	const Fragment = wp.element.Fragment;
	const el = wp.element.createElement;
	const useState = wp.element.useState;
	const useEffect = wp.element.useEffect;
	const __ = wp.i18n.__;
	const registerPlugin = wp.plugins.registerPlugin;
	const PluginSidebar = wp.editor.PluginSidebar;
	const PluginSidebarMoreMenuItem = wp.editor.PluginSidebarMoreMenuItem;

	function SidebarContents() {
		const [ range, setRange ] = useState( { start: 0, end: 0 } );

		const blocks = useSelect( ( sel ) => {
			return sel( 'core/block-editor' ).getBlocks();
		} );

		const { __experimentalAddAnnotation: addAnnotation } =
			useDispatch( 'core/annotations' );

		const allBlocks = blocks
			.filter( ( block ) => block.name === 'core/paragraph' )
			.map( ( block ) => [
				block.clientId,
				block.attributes.content.text,
			] );

		useEffect( () => {
			allBlocks.forEach( ( [ clientId, content ] ) => {
				const applePosition = content.indexOf( 'apple' );
				if ( applePosition !== -1 ) {
					addAnnotation( {
						source: 'test-annotation',
						blockClientId: clientId,
						richTextIdentifier: 'content',
						range: {
							start: applePosition,
							end: applePosition + 5,
						},
					} );
				}
			} );
		} );

		return el(
			PanelBody,
			{},
			el( 'input', {
				type: 'number',
				id: 'annotations-tests-range-start',
				onChange: ( reactEvent ) => {
					setRange( {
						...range,
						start: reactEvent.target.value,
					} );
				},
				value: range.start,
			} ),
			el( 'input', {
				type: 'number',
				id: 'annotations-tests-range-end',
				onChange: ( reactEvent ) => {
					setRange( {
						...range,
						end: reactEvent.target.value,
					} );
				},
				value: range.end,
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
								start: parseInt( range.start, 10 ),
								end: parseInt( range.end, 10 ),
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
