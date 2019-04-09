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
 * Internal dependencies
 */
import { computeOutlineHeadings } from '../../../editor/src/components/document-outline/index.js';

export const HeadingChecker = ( { blocks = [], selectedLevel, selectedHeadingId } ) => {
	const headings = computeOutlineHeadings( blocks );

	// Iterate headings to find prevHeadingLevel
	let prevHeadingLevel = 1;
	let i = 0;
	for ( i = 0; i < headings.length; i++ ) {
		if ( i >= 1 && headings[ i ].clientId === selectedHeadingId ) {
			prevHeadingLevel = headings[ i - 1 ].level;
		}
	}

	const isIncorrectLevel = ( selectedLevel === 1 || selectedLevel > prevHeadingLevel + 1 );

	if ( ! isIncorrectLevel ) {
		return null;
	}

	const msg = __( 'This heading level is incorrect. ' );

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
