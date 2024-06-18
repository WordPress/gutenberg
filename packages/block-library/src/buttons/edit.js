/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

const DEFAULT_BLOCK = {
	name: 'core/button',
	attributesToCopy: [
		'backgroundColor',
		'border',
		'className',
		'fontFamily',
		'fontSize',
		'gradient',
		'style',
		'textColor',
		'width',
	],
};

function ButtonsEdit( { attributes, className } ) {
	const { fontSize, layout, style } = attributes;
	const blockProps = useBlockProps( {
		className: clsx( className, {
			'has-custom-font-size': fontSize || style?.typography?.fontSize,
		} ),
	} );
	const { hasButtonVariations } = useSelect( ( select ) => {
		const buttonVariations = select( blocksStore ).getBlockVariations(
			'core/button',
			'inserter'
		);
		return {
			hasButtonVariations: buttonVariations.length > 0,
		};
	}, [] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		// This check should be handled by the `Inserter` internally to be consistent across all blocks that use it.
		directInsert: ! hasButtonVariations,
		template: [ [ 'core/button' ] ],
		templateInsertUpdatesSelection: true,
		orientation: layout?.orientation ?? 'horizontal',
	} );

	return <div { ...innerBlocksProps } />;
}

export default ButtonsEdit;
