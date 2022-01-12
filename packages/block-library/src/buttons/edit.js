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

function ButtonsEdit( { attributes: { layout = {} }, clientId } ) {
	const blockProps = useBlockProps();
	const preferredStyle = useSelect( ( select ) => {
		const preferredStyleVariations = select(
			blockEditorStore
		).getSettings().__experimentalPreferredStyleVariations;
		return preferredStyleVariations?.value?.[ buttonBlockName ];
	}, [] );

	const innerBlocks = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId )?.innerBlocks;
		},
		[ clientId ]
	);

	let defaultAttributes = {};

	if ( innerBlocks?.length ) {
		defaultAttributes = { ...innerBlocks[ 0 ].attributes };
		defaultAttributes.text = undefined;
		defaultAttributes.url = undefined;
	}

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		__experimentalDefaultBlock: [
			buttonBlockName,
			{
				...defaultAttributes,
			},
		],
		__experimentalDirectInsert: true,
		template: [
			[
				buttonBlockName,
				{ className: preferredStyle && `is-style-${ preferredStyle }` },
			],
		],
		__experimentalLayout: layout,
		templateInsertUpdatesSelection: true,
	} );

	return (
		<>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default ButtonsEdit;
