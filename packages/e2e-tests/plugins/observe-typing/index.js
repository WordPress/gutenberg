( function () {
	const { registerBlockType } = wp.blocks;
	const { useBlockProps, BlockControls } = wp.blockEditor;
	const { Dropdown, ToolbarButton, TextControl } = wp.components;
	const { createElement: el, useState } = wp.element;

	registerBlockType( 'e2e-tests/observe-typing', {
		apiVersion: 3,
		title: 'Observe Typing',
		description: 'Observe Typing test block.',
		category: 'widgets',
		edit: function Edit() {
			const [ value, setValue ] = useState( '' );
			const blockProps = useBlockProps();

			return el(
				'div',
				blockProps,
				el(
					BlockControls,
					{ group: 'block' },
					el( Dropdown, {
						renderToggle: ( { onToggle } ) =>
							el(
								ToolbarButton,
								{
									onClick: onToggle,
								},
								'Open Dropdown'
							),
						renderContent: () =>
							el( TextControl, {
								label: 'Dropdown field',
								value,
								onChange: setValue,
								__next40pxDefaultSize: true,
							} ),
					} )
				),
				el( 'p', {}, 'Hello Editor!' )
			);
		},
		save: () => null,
	} );
} )();
