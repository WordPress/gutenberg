/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

// Modified from packages/editor/src/components/document-outline/index.js.
/**
 * Returns an array of heading blocks enhanced with the following properties:
 * path    - An array of blocks that are ancestors of the heading starting from a top-level node.
 *           Can be an empty array if the heading is a top-level node (is not nested inside another block).
 * level   - An integer with the heading level.
 *
 * @param {?Array} blocks An array of blocks.
 * @param {?Array} path   An array of blocks that are ancestors of the blocks passed as blocks.
 *
 * @return {Array} An array of heading blocks enhanced with the properties described above.
 */
function computeOutlineHeadings( blocks = [], path = [] ) {
	return blocks.flatMap( ( block = {} ) => {
		if ( block.name === 'core/heading' ) {
			return {
				...block,
				path,
				level: block.attributes.level,
			};
		}
		return computeOutlineHeadings( block.innerBlocks, [ ...path, block ] );
	} );
}

/**
 * Hook that returns a function to compare a heading level to the preceding one.
 *
 * @param {string} currentBlockClientId The client id of the current block.
 *
 * @return {Function} Function to compare a given heading level to the preceding
 *                    one and determine if it is invalid.
 */
export default function useHeadingLevelValidator( currentBlockClientId ) {
	const { hasMultipleH1, hasTitle, precedingLevel } = useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );
			const { getBlocks } = select( blockEditorStore );
			const { getEditedPostAttribute } = select( editorStore );
			const postType = getPostType( getEditedPostAttribute( 'type' ) );

			const titleNode = document.getElementsByClassName(
				'editor-post-title__input'
			)[ 0 ];
			const isTitleSupported = postType?.supports?.title ?? false;
			const titleIsNotEmpty = !! getEditedPostAttribute( 'title' );
			const _hasTitle = isTitleSupported && titleIsNotEmpty && titleNode;

			const headings = computeOutlineHeadings( getBlocks() ?? [] );

			const currentHeadingIndex = headings.findIndex(
				( { clientId } ) => clientId === currentBlockClientId
			);

			// Default the assumed previous level to H1.
			let _precedingLevel = 1;

			// If the current block isn't the first Heading block in the content,
			// set prevLevel to the level of the closest Heading block preceding
			// it.
			if ( currentHeadingIndex > 0 ) {
				_precedingLevel = headings[ currentHeadingIndex - 1 ].level;
			}

			return {
				hasMultipleH1: headings.some( ( { level } ) => level === 1 ),
				hasTitle: _hasTitle,
				precedingLevel: _precedingLevel,
			};
		},
		[]
	);

	return ( targetLevel ) => {
		const levelIsDuplicateH1 = hasMultipleH1 && targetLevel === 1;
		const levelAndPostTitleMayBothBeH1 =
			targetLevel === 1 && hasTitle && ! hasMultipleH1;
		const levelIsTooDeep = targetLevel > precedingLevel + 1;
		const levelIsInvalid = levelIsDuplicateH1 || levelIsTooDeep;
		const levelMayBeInvalid =
			levelIsInvalid || levelAndPostTitleMayBothBeH1;

		return {
			levelIsInvalid,
			levelMayBeInvalid,
		};
	};
}
