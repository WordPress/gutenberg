( function () {
	const { createElement: el, useState, useCallback } = wp.element;

	const {
		BlockEditorKeyboardShortcuts,
		BlockEditorProvider,
		BlockList,
		BlockTools,
		BlockToolbar,
		ObserveTyping,
		WritingFlow,
	} = wp.blockEditor;

	const { SlotFillProvider, Popover } = wp.components;

	/**
	 * Minimal block editor — mirrors the architecture of Press This and
	 * other standalone BlockEditorProvider integrations. No iframe, no
	 * full editor chrome, no EditorProvider / core-data entity layer.
	 */
	function SlimEditor() {
		const [ blocks, setBlocks ] = useState( [] );

		const onInput = useCallback(
			( newBlocks ) => {
				setBlocks( newBlocks );
			},
			[ setBlocks ]
		);

		const onChange = useCallback(
			( newBlocks ) => {
				setBlocks( newBlocks );
			},
			[ setBlocks ]
		);

		return el(
			SlotFillProvider,
			null,
			el(
				BlockEditorProvider,
				{
					value: blocks,
					onInput,
					onChange,
					settings: {
						hasFixedToolbar: true,
						bodyPlaceholder: 'Type here…',
					},
				},
				el(
					'div',
					{
						className: 'slim-editor',
						style: {
							border: '1px solid #ddd',
							borderRadius: '4px',
							overflow: 'hidden',
						},
					},
					el(
						'div',
						{
							className: 'slim-editor__toolbar',
							style: {
								borderBottom: '1px solid #ddd',
								padding: '4px',
							},
						},
						el( BlockToolbar, { hideDragHandle: true } )
					),
					el(
						'div',
						{
							className: 'slim-editor__content',
							style: { padding: '16px', minHeight: '200px' },
						},
						el( BlockEditorKeyboardShortcuts.Register, null ),
						el(
							BlockTools,
							null,
							el(
								WritingFlow,
								null,
								el( ObserveTyping, null, el( BlockList, null ) )
							)
						)
					)
				),
				el( Popover.Slot, null )
			)
		);
	}

	// Register core blocks — required for standalone editor setups
	// where the block library script is loaded but not auto-initialized.
	if ( wp.blockLibrary && wp.blockLibrary.registerCoreBlocks ) {
		wp.blockLibrary.registerCoreBlocks();
	}

	const root = document.getElementById( 'slim-editor-root' );
	if ( root ) {
		wp.element.createRoot( root ).render( el( SlimEditor ) );
	}
} )();
