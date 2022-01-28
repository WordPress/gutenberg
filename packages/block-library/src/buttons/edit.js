/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
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

function ButtonsEdit( { attributes: { layout = {} }, clientId } ) {
	const blockProps = useBlockProps();
	const preferredStyle = useSelect( ( select ) => {
		const preferredStyleVariations = select(
			blockEditorStore
		).getSettings().__experimentalPreferredStyleVariations;
		return preferredStyleVariations?.value?.[ buttonBlockName ];
	}, [] );

	const { hasChildBlocks } = useSelect(
		( select ) => {
			const { getBlockOrder } = select( blockEditorStore );
			return {
				hasChildBlocks: getBlockOrder( clientId ).length > 0,
			};
		},
		[ clientId ]
	);
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
		__experimentalLayout: layout,
		templateInsertUpdatesSelection: true,
		renderAppender: hasChildBlocks
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	} );
	return (
		<>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default ButtonsEdit;
