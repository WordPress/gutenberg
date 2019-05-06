/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import WordCount from '../word-count';
import DocumentOutline from '../document-outline';

function TableOfContentsPanel( { headingCount, paragraphCount, numberOfBlocks, hasOutlineItemsDisabled, onRequestClose } ) {
	return (
		<>
			<ul
				className="table-of-contents__counts"
				role="note"
				aria-label={ __( 'Document Statistics' ) }
				tabIndex="0"
			>
				<li className="table-of-contents__count">
					{ __( 'Words' ) }
					<WordCount />
				</li>
				<li className="table-of-contents__count">
					{ __( 'Headings' ) }
					<span className="table-of-contents__number">
						{ headingCount }
					</span>
				</li>
				<li className="table-of-contents__count">
					{ __( 'Paragraphs' ) }
					<span className="table-of-contents__number">
						{ paragraphCount }
					</span>
				</li>
				<li className="table-of-contents__count">
					{ __( 'Blocks' ) }
					<span className="table-of-contents__number">
						{ numberOfBlocks }
					</span>
				</li>
			</ul>
			{ headingCount > 0 && (
				<>
					<hr />
					<h2 className="table-of-contents__title">
						{ __( 'Document Outline' ) }
					</h2>
					<DocumentOutline onSelect={ onRequestClose } hasOutlineItemsDisabled={ hasOutlineItemsDisabled } />
				</>
			) }
		</>
	);
}

export default withSelect( ( select ) => {
	const { getGlobalBlockCount } = select( 'core/block-editor' );
	return {
		headingCount: getGlobalBlockCount( 'core/heading' ),
		paragraphCount: getGlobalBlockCount( 'core/paragraph' ),
		numberOfBlocks: getGlobalBlockCount(),
	};
} )( TableOfContentsPanel );
