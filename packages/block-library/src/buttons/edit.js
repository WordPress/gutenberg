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
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button';

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
	const preferredStyle = useSelect( ( select ) => {
		const preferredStyleVariations =
			select( blockEditorStore ).getSettings()
				.__experimentalPreferredStyleVariations;
		return preferredStyleVariations?.value?.[ buttonBlockName ];
	}, [] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		__experimentalDefaultBlock: DEFAULT_BLOCK,
		__experimentalDirectInsert: true,
		template: [
			[
				buttonBlockName,
				{ className: preferredStyle && `is-style-${ preferredStyle }` },
			],
		],
		templateInsertUpdatesSelection: true,
		orientation: layout?.orientation ?? 'horizontal',
	} );

	return <div { ...innerBlocksProps } />;
}

export default ButtonsEdit;
