/**
 * External dependencies
 */
import { countBy, flatMap, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

// copy from packages/editor/src/components/document-outline/index.js
/**
 * Returns an array of heading blocks enhanced with the following properties:
 * path    - An array of blocks that are ancestors of the heading starting from a top-level node.
 *           Can be an empty array if the heading is a top-level node (is not nested inside another block).
 * level   - An integer with the heading level.
 * isEmpty - Flag indicating if the heading has no content.
 *
 * @param {?Array} blocks An array of blocks.
 * @param {?Array} path   An array of blocks that are ancestors of the blocks passed as blocks.
 *
 * @return {Array} An array of heading blocks enhanced with the properties described above.
 */
export const computeOutlineHeadings = ( blocks = [], path = [] ) => {
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
};

export const HeadingLevelChecker = ( {
	blocks = [],
	title,
	isTitleSupported,
	selectedHeadingId,
} ) => {
	const headings = computeOutlineHeadings( blocks );

	// Iterate headings to find prevHeadingLevel and selectedLevel
	let prevHeadingLevel = 1;
	let selectedLevel = 1;
	let i = 0;
	for ( i = 0; i < headings.length; i++ ) {
		if ( headings[ i ].clientId === selectedHeadingId ) {
			selectedLevel = headings[ i ].level;
			if ( i >= 1 ) {
				prevHeadingLevel = headings[ i - 1 ].level;
			}
		}
	}

	const titleNode = document.querySelector( '.editor-post-title__input' );
	const hasTitle = isTitleSupported && title && titleNode;
	const countByLevel = countBy( headings, 'level' );
	const hasMultipleH1 = countByLevel[ 1 ] > 1;
	const isIncorrectLevel = selectedLevel > prevHeadingLevel + 1;

	// For accessibility
	useEffect( () => {
		if ( isIncorrectLevel ) speak( msg );
	}, [ isIncorrectLevel, selectedLevel ] );

	let msg = '';
	if ( isIncorrectLevel ) {
		msg = __( 'This heading level is incorrect.' );
	} else if ( selectedLevel === 1 && hasMultipleH1 ) {
		msg = __( 'Multiple H1 headings found.' );
	} else if ( selectedLevel === 1 && hasTitle && ! hasMultipleH1 ) {
		msg = __( 'H1 is already used for the post title.' );
	} else {
		return null;
	}

	return (
		<div className="block-library-heading__heading-level-checker">
			<Notice status="warning" isDismissible={ false }>
				{ msg }
			</Notice>
		</div>
	);
};

export default compose(
	withSelect( ( select ) => {
		const { getBlocks } = select( 'core/block-editor' );
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getPostType } = select( 'core' );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return {
			blocks: getBlocks(),
			title: getEditedPostAttribute( 'title' ),
			isTitleSupported: get( postType, [ 'supports', 'title' ], false ),
		};
	} )
)( HeadingLevelChecker );
