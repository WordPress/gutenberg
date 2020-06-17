/**
 * External dependencies
 */
import { flatMap } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

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
	// We don't polyfill native JS [].flatMap yet, so we have to use Lodash.
	return flatMap( blocks, ( block = {} ) => {
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
	const { headings, isTitleSupported, titleIsNotEmpty } = useSelect(
		( select ) => {
			const { getPostType } = select( 'core' );
			const { getBlocks } = select( 'core/block-editor' );
			const { getEditedPostAttribute } = select( 'core/editor' );
			const postType = getPostType( getEditedPostAttribute( 'type' ) );

			return {
				headings: computeOutlineHeadings( getBlocks() ?? [] ),
				isTitleSupported: postType?.supports?.title ?? false,
				titleIsNotEmpty: !! getEditedPostAttribute( 'title' ),
			};
		},
		[]
	);

	const currentHeadingIndex = headings.findIndex(
		( { clientId } ) => clientId === currentBlockClientId
	);

	// Default the assumed previous level to H1.
	let precedingLevel = 1;

	// If the current block isn't the first Heading block in the content, set
	// prevLevel to the level of the closest Heading block preceding it.
	if ( currentHeadingIndex > 0 ) {
		precedingLevel = headings[ currentHeadingIndex - 1 ].level;
	}

	const titleNode = document.getElementsByClassName(
		'editor-post-title__input'
	)[ 0 ];
	const hasTitle = isTitleSupported && titleIsNotEmpty && titleNode;
	const hasMultipleH1 = useMemo(
		() => headings.filter( ( { level } ) => level === 1 ).length > 1,
		[ headings ]
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
