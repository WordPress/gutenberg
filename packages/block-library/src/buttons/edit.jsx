import clsx from 'clsx';
import {
	BlockControls,
	Inserter,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DEFAULT_BLOCK = {
	name: 'core/button',
};

function ButtonsEdit( { attributes, className, clientId } ) {
	const { fontSize, layout, style } = attributes;
	const blockProps = useBlockProps( {
		className: clsx( className, {
			'has-custom-font-size': fontSize || style?.typography?.fontSize,
		} ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		orientation: layout?.orientation ?? 'horizontal',

		// No on-canvas appender: adding a button goes through the toolbar.
		renderAppender: false,
	} );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ /* `core/button` is the only allowed child, so Inserter
					     renders a one-click button and names it from the block
					     title rather than a hardcoded string. */ }
					<Inserter
						rootClientId={ clientId }
						isAppender
						toggleProps={ {
							as: ToolbarButton,
							name: 'add-button',
							icon: undefined,
							children: __( 'Add button' ),
						} }
					/>
				</ToolbarGroup>
			</BlockControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default ButtonsEdit;
