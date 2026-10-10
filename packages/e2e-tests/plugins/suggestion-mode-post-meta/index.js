( function () {
	const el = wp.element.createElement;
	const { useSelect, useDispatch } = wp.data;
	const { TextControl } = wp.components;
	const { PluginDocumentSettingPanel, store: editorStore } = wp.editor;

	/*
	 * The classic pattern for a meta field: read through
	 * `getEditedPostAttribute( 'meta' )` and write through `editPost`.
	 */
	function SuggestionTestMetaPanel() {
		const value = useSelect(
			( select ) =>
				select( editorStore ).getEditedPostAttribute( 'meta' )
					?.suggestion_test_meta ?? '',
			[]
		);
		const { editPost } = useDispatch( editorStore );
		return el(
			PluginDocumentSettingPanel,
			{
				name: 'suggestion-test-meta',
				title: 'Test meta',
				initialOpen: true,
			},
			el( TextControl, {
				__next40pxDefaultSize: true,
				label: 'Test meta value',
				value,
				onChange: ( next ) =>
					editPost( { meta: { suggestion_test_meta: next } } ),
			} )
		);
	}

	wp.plugins.registerPlugin( 'suggestion-test-meta', {
		render: SuggestionTestMetaPanel,
	} );
} )();
