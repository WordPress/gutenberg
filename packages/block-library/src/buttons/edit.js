/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
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

function ButtonsEdit( { attributes, className, clientId } ) {
	const { fontSize, layout, style } = attributes;
	const blockProps = useBlockProps( {
		className: clsx( className, {
			'has-custom-font-size': fontSize || style?.typography?.fontSize,
		} ),
	} );

	const { hasButtonVariations, hasMultipleAllowedBlocks } = useSelect(
		( select ) => {
			const buttonVariations = select( blocksStore ).getBlockVariations(
				'core/button',
				'inserter'
			);
			const allowedBlocks =
				select( blockEditorStore ).getAllowedBlocks( clientId );
			return {
				hasButtonVariations: buttonVariations.length > 0,
				hasMultipleAllowedBlocks:
					allowedBlocks && allowedBlocks.length > 1,
			};
		},
		[ clientId ]
	);

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		directInsert: ! hasButtonVariations && ! hasMultipleAllowedBlocks,
		template: [ [ 'core/button' ] ],
		templateInsertUpdatesSelection: true,
		orientation: layout?.orientation ?? 'horizontal',
	} );

	return <div { ...innerBlocksProps } />;
}

export default ButtonsEdit;
