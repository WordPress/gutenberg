( function () {
	const el = wp.element.createElement;
	const Fragment = wp.element.Fragment;
	const Button = wp.components.Button;
	const PanelBody = wp.components.PanelBody;
	const InspectorControls = wp.blockEditor.InspectorControls;
	const addFilter = wp.hooks.addFilter;
	const createBlock = wp.blocks.createBlock;
	const __ = wp.i18n.__;

	function ResetBlockButton( props ) {
		return el(
			PanelBody,
			{},
			el(
				Button,
				{
					className: 'e2e-reset-block-button',
					variant: "secondary",
					isLarge: true,
					onClick() {
						const emptyBlock = createBlock( props.name );
						props.onReplace( emptyBlock );
					},
				},
				__( 'Reset Block' )
			)
		);
	}

	function addResetBlockButton( BlockEdit ) {
		return function ( props ) {
			return el(
				Fragment,
				{},
				el(
					InspectorControls,
					{},
					el( ResetBlockButton, {
						name: props.name,
						onReplace: props.onReplace,
					} )
				),
				el( BlockEdit, props )
			);
		};
	}

	addFilter(
		'editor.BlockEdit',
		'e2e/hooks-api/add-reset-block-button',
		addResetBlockButton,
		100
	);
} )();
