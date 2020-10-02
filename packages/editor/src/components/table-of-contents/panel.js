/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import WordCount from '../word-count';
import DocumentOutline from '../document-outline';
import CharacterCount from '../character-count';

function TableOfContentsPanel( { hasOutlineItemsDisabled, onRequestClose } ) {
	const { headingCount, paragraphCount, numberOfBlocks } = useSelect(
		( select ) => {
			const { getGlobalBlockCount } = select( 'core/block-editor' );
			return {
				headingCount: getGlobalBlockCount( 'core/heading' ),
				paragraphCount: getGlobalBlockCount( 'core/paragraph' ),
				numberOfBlocks: getGlobalBlockCount(),
			};
		},
		[]
	);
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
						<span className="table-of-contents__number">
							<CharacterCount />
						</span>
						<span className="table-of-contents__label">
							{ __( 'Characters' ) }
						</span>
					</li>
					<li className="table-of-contents__count">
						<WordCount />
						<span className="table-of-contents__label">
							{ __( 'Words' ) }
						</span>
					</li>
					<li className="table-of-contents__count">
						<span className="table-of-contents__number">
							{ headingCount }
						</span>
						<span className="table-of-contents__label">
							{ __( 'Headings' ) }
						</span>
					</li>
					<li className="table-of-contents__count">
						<span className="table-of-contents__number">
							{ paragraphCount }
						</span>
						<span className="table-of-contents__label">
							{ __( 'Paragraphs' ) }
						</span>
					</li>
					<li className="table-of-contents__count">
						<span className="table-of-contents__number">
							{ numberOfBlocks }
						</span>
						<span className="table-of-contents__label">
							{ __( 'Blocks' ) }
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

export default TableOfContentsPanel;
