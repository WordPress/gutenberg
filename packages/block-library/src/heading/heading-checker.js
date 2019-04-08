/**
 * External dependencies
 */
import { flatMap } from 'lodash';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

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
const computeOutlineHeadings = ( blocks = [], path = [] ) => {
	return flatMap( blocks, ( block = {} ) => {
		if ( block.name === 'core/heading' ) {
			return {
				...block,
				path,
				headingId: block.clientId,
				level: block.attributes.level,
				isEmpty: isEmptyHeading( block ),
			};
		}
		return computeOutlineHeadings( block.innerBlocks, [ ...path, block ] );
	} );
};

const isEmptyHeading = ( heading ) => ! heading.attributes.content || heading.attributes.content.length === 0;

export const HeadingChecker = ( { blocks = [], selectedLevel, selectedHeadingId } ) => {
	const headings = computeOutlineHeadings( blocks );

	// Iterate headings to find prevHeadingLevel
	let prevHeadingLevel = 1;
	let i = 0;
	for ( i = 0; i < headings.length; i++ ) {
		if ( i >= 1 && headings[ i ].headingId === selectedHeadingId ) {
			prevHeadingLevel = headings[ i - 1 ].level;
		}
	}

	const isIncorrectLevel = ( selectedLevel === 1 || selectedLevel > prevHeadingLevel + 1 );

	if ( ! isIncorrectLevel ) {
		return null;
	}

	// The correct heading level should be within [H2, prevHeadingLevel+1]
	let suggestedHeading = 'H2';
	for ( i = 3; i < prevHeadingLevel + 2; i++ ) {
		suggestedHeading = suggestedHeading + ', H' + i;
	}

	const msg = __( 'This heading level is incorrect. Please use ' + suggestedHeading + ' instead.' );

	// For accessibility
	useEffect( () => {
		speak( __( 'This heading level is incorrect' ) );
	}, [ selectedLevel ] );

	return (
		<div className="editor-heading-checker block-editor-heading-checker">
			<Notice status="warning" isDismissible={ false }>
				{ msg }
			</Notice>
		</div>
	);
};

export default compose(
	withSelect( ( select ) => {
		const { getBlocks } = select( 'core/block-editor' );

		return {
			blocks: getBlocks(),
		};
	} )
)( HeadingChecker );
