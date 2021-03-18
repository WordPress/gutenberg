/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockContent } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Extracts heading levels from the provided HTML content.
 *
 * @param {string} content The content to extract heading data from.
 *
 * @return {number[]} Array of integers representing the level of each heading
 *                    found in the provided content.
 */
function getHeadingLevelsFromContent( content ) {
	// Create a temporary container to put the post content into, so we can
	// use the DOM to find all the headings.
	const tempPostContentDOM = document.createElement( 'div' );
	tempPostContentDOM.innerHTML = content;

	// Remove template elements so that headings inside them aren't counted.
	// This is only needed for IE11, which doesn't recognize the element and
	// treats it like a div.
	for ( const template of tempPostContentDOM.querySelectorAll(
		'template'
	) ) {
		template.remove();
	}

	const headingElements = tempPostContentDOM.querySelectorAll(
		'h1, h2, h3, h4, h5, h6'
	);

	return [ ...headingElements ].map( ( heading ) =>
		// A little hacky, but since we know at this point that the tag will
		// be an H1-H6, we can just grab the 2nd character of the tag name and
		// convert it to an integer. Should be faster than conditionals.
		parseInt( heading.tagName[ 1 ], 10 )
	);
}

/**
 * Hook that returns a function to compare a heading level to the preceding one.
 *
 * @param {string} currentBlockClientId The client id of the current block.
 *
 * @return {(level: number) => 'invalid' | 'maybe invalid' | 'valid'}
 * Function to compare a given heading level to the preceding one and determine
 * if it is valid.
 */
export default function useHeadingLevelValidator( currentBlockClientId ) {
	const hasTitle = useSelect( ( select ) => {
		const { getPostType } = select( coreStore );
		const { getEditedPostAttribute } = select( editorStore );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		const titleNode = document.getElementsByClassName(
			'editor-post-title__input'
		)[ 0 ];
		const isTitleSupported = postType?.supports?.title ?? false;
		const titleIsNotEmpty = !! getEditedPostAttribute( 'title' );

		return isTitleSupported && titleIsNotEmpty && titleNode;
	}, [] );

	const { hasH1sInContent, precedingLevel } = useSelect( ( select ) => {
		const { getBlock, getBlockIndex, getBlockOrder } = select(
			blockEditorStore
		);
		const blockIndex = getBlockIndex( currentBlockClientId );
		const blockOrder = getBlockOrder();

		let postContentPrecedingCurrentHeading = '';
		for ( let i = 0; i < blockIndex; i++ ) {
			const otherBlockClientId = blockOrder[ i ];
			const blockContent = getBlockContent(
				getBlock( otherBlockClientId )
			);
			postContentPrecedingCurrentHeading += blockContent;
		}

		const precedingHeadingLevels = getHeadingLevelsFromContent(
			postContentPrecedingCurrentHeading
		);

		const currentHeadingIndex = precedingHeadingLevels.length;

		// Default the assumed previous level to H1.
		let _precedingLevel = 1;

		// If the current block isn't the first Heading block in the content,
		// set prevLevel to the level of the closest Heading block preceding
		// it.
		if ( currentHeadingIndex > 0 ) {
			_precedingLevel = precedingHeadingLevels[ currentHeadingIndex - 1 ];
		}

		return {
			hasH1sInContent: precedingHeadingLevels.includes( 1 ),
			precedingLevel: _precedingLevel,
		};
	}, [] );

	return ( level ) => {
		const levelIsDuplicateH1 = hasH1sInContent && level === 1;
		const levelAndPostTitleMayBothBeH1 =
			level === 1 && hasTitle && ! hasH1sInContent;
		const levelIsTooDeep = level > precedingLevel + 1;

		if ( levelIsDuplicateH1 || levelIsTooDeep ) {
			return 'invalid';
		} else if ( levelAndPostTitleMayBothBeH1 ) {
			return 'maybe invalid';
		}
		return 'valid';
	};
}
