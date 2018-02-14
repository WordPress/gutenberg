/**
 * External dependencies
 */
import { countBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { query } from '@wordpress/data';

/**
 * Internal dependencies
 */
import WordCount from '../word-count';
import DocumentOutline from '../document-outline';

function TableOfContentsPanel( { blocks } ) {
	const blockCount = countBy( blocks, 'name' );

	return (
		<Fragment>
			<div className="table-of-contents__counts">
				<div className="table-of-contents__count">
					{ __( 'Words' ) }
					<WordCount />
				</div>
				<div className="table-of-contents__count">
					{ __( 'Headings' ) }
					<span className="table-of-contents__number">
						{ blockCount[ 'core/heading' ] || 0 }
					</span>
				</div>
				<div className="table-of-contents__count">
					{ __( 'Paragraphs' ) }
					<span className="table-of-contents__number">
						{ blockCount[ 'core/paragraph' ] || 0 }
					</span>
				</div>
				<div className="table-of-contents__count">
					{ __( 'Blocks' ) }
					<span className="table-of-contents__number">
						{ blocks.length }
					</span>
				</div>
			</div>
			{ blockCount[ 'core/heading' ] > 0 && (
				<Fragment>
					<hr />
					<span className="table-of-contents__title">
						{ __( 'Document Outline' ) }
					</span>
					<DocumentOutline />
				</Fragment>
			) }
		</Fragment>
	);
}

export default query( ( select ) => {
	return {
		blocks: select( 'core/editor' ).getBlocks(),
	};
} )( TableOfContentsPanel );
