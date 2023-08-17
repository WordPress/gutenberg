/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

const buttonBlockName = 'core/button';

const ALLOWED_BLOCKS = [ buttonBlockName ];

const DEFAULT_BLOCK = {
	name: buttonBlockName,
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
		className: classnames( className, {
			'has-custom-font-size': fontSize || style?.typography?.fontSize,
		} ),
	} );
	const defaultButtonAttributes = useSelect( ( select ) => {
		const preferredStyleVariations =
			select( blockEditorStore ).getSettings()
				.__experimentalPreferredStyleVariations;
		const preferredStyle =
			preferredStyleVariations?.value?.[ buttonBlockName ];
		const defaultButton = select( blocksStore ).getDefaultBlockVariation(
			buttonBlockName
		) || { attributes: {} };
		return {
			...defaultButton.attributes,
			className: classnames( defaultButton.attributes.className, {
				[ `is-style-${ preferredStyle }` ]: !! preferredStyle,
			} ),
		};
	}, [] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		defaultBlock: { ...DEFAULT_BLOCK, attributes: defaultButtonAttributes },
		directInsert: true,
		template: [ [ buttonBlockName, defaultButtonAttributes ] ],
		templateInsertUpdatesSelection: true,
		orientation: layout?.orientation ?? 'horizontal',
	} );

	return <div { ...innerBlocksProps } />;
}

export default ButtonsEdit;
