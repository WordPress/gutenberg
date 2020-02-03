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

function TableOfContentsPanel( {
	headingCount,
	paragraphCount,
	numberOfBlocks,
	hasOutlineItemsDisabled,
	onRequestClose,
} ) {
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<>
			<div
				className="table-of-contents__wrapper"
				role="note"
				aria-label={ __( 'Document Statistics' ) }
				tabIndex="0"
			>
				<ul role="list" className="table-of-contents__counts">
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
			</div>
			{ headingCount > 0 && (
				<>
					<hr />
					<h2 className="table-of-contents__title">
						{ __( 'Document Outline' ) }
					</h2>
					<DocumentOutline
						onSelect={ onRequestClose }
						hasOutlineItemsDisabled={ hasOutlineItemsDisabled }
					/>
				</>
			) }
		</>
		/* eslint-enable jsx-a11y/no-redundant-roles */
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
