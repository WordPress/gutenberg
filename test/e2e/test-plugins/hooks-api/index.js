( function() {
	var el = wp.element.createElement;
	var Fragment = wp.element.Fragment;
	var Button = wp.components.Button;
	var InspectorControls = wp.editor.InspectorControls;
	var addFilter = wp.hooks.addFilter;
	var createBlock = wp.blocks.createBlock;
	var __ = wp.i18n.__;

	function ResetBlockUI( props ){
		return el(
			Button,
			{
				className: 'reset-block-button',
				isDefault: true,
				isLarge: true,
				onClick: function(){
					var emptyBlock = createBlock( props.name );
					props.onReplace( emptyBlock );
				}
			},
			__( 'Reset Block' )
		);
	}

	function resetBlockFilter( BlockEdit ){
		return function( props ){
			return el(
				Fragment,
				{},
				el( InspectorControls, {}, el( ResetBlockUI, props )  ),
				el( BlockEdit, props )
			);
		};
	}
	addFilter( 'blocks.BlockEdit', 'demo/resetBlock', resetBlockFilter, 100 );
} )();
