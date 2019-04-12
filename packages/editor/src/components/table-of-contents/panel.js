/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { TabPanel } from '@wordpress/components';
import { BlockNavigation } from '@wordpress/block-editor';
import { __experimentalCreateInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WordCount from '../word-count';
import DocumentOutline from '../document-outline';

function TableOfContentsPanel( {
	headingCount,
	paragraphCount,
	blockCount,
	hasOutlineItemsDisabled,
	onRequestClose,
} ) {
	return (
		<TabPanel
			className="table-of-contents__tab-panel"
			tabs={ [
				{
					name: 'navigation',
					title: __( 'Navigation' ),
				},
				{
					name: 'content',
					title: __( 'Content' ),
				},
			] }
		>
			{ ( tab ) => {
				if ( tab.name === 'content' ) {
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
								<ul
									role="list"
									className="table-of-contents__counts"
								>
									<li>
										{ __experimentalCreateInterpolateElement(
											__( '<WordCount /> words' ),
											{
												WordCount: (
													<strong>
														<WordCount />
													</strong>
												),
											}
										) }
									</li>
									<li>
										{ __experimentalCreateInterpolateElement(
											__( '<HeadingCount /> headings' ),
											{
												HeadingCount: (
													<strong>
														{ headingCount }
													</strong>
												),
											}
										) }
									</li>
									<li>
										{ __experimentalCreateInterpolateElement(
											__(
												'<ParagraphCount /> paragraphs'
											),
											{
												ParagraphCount: (
													<strong>
														{ paragraphCount }
													</strong>
												),
											}
										) }
									</li>
									<li>
										{ __experimentalCreateInterpolateElement(
											__( '<BlockCount /> blocks' ),
											{
												BlockCount: (
													<strong>
														{ blockCount }
													</strong>
												),
											}
										) }
									</li>
								</ul>
							</div>
							{ headingCount > 0 && (
								<>
									<h2 className="table-of-contents__title">
										{ __( 'Document Outline' ) }
									</h2>
									<DocumentOutline
										onSelect={ onRequestClose }
										hasOutlineItemsDisabled={
											hasOutlineItemsDisabled
										}
									/>
								</>
							) }
						</>
						/* eslint-enable jsx-a11y/no-redundant-roles */
					);
				}

				return <BlockNavigation />;
			} }
		</TabPanel>
	);
}

export default withSelect( ( select ) => {
	const { getGlobalBlockCount } = select( 'core/block-editor' );
	return {
		headingCount: getGlobalBlockCount( 'core/heading' ),
		paragraphCount: getGlobalBlockCount( 'core/paragraph' ),
		blockCount: getGlobalBlockCount(),
	};
} )( TableOfContentsPanel );
