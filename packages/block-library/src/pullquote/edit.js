/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	AlignmentControl,
	BlockControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Figure } from './figure';
import { BlockQuote } from './blockquote';

const isWebPlatform = Platform.OS === 'web';

function PullQuoteEdit( {
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
} ) {
	const { textAlign, citation, value } = attributes;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	const shouldShowCitation = ! RichText.isEmpty( citation ) || isSelected;

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<Figure { ...blockProps }>
				<BlockQuote>
					<RichText
						identifier="value"
						multiline
						value={ value }
						onChange={ ( nextValue ) =>
							setAttributes( {
								value: nextValue,
							} )
						}
						aria-label={ __( 'Pullquote text' ) }
						placeholder={
							// translators: placeholder text used for the quote
							__( 'Add quote' )
						}
						textAlign="center"
					/>
					{ shouldShowCitation && (
						<RichText
							identifier="citation"
							tagName={ isWebPlatform ? 'cite' : undefined }
							style={ { display: 'block' } }
							value={ citation }
							aria-label={ __( 'Pullquote citation text' ) }
							placeholder={
								// translators: placeholder text used for the citation
								__( 'Add citation' )
							}
							onChange={ ( nextCitation ) =>
								setAttributes( {
									citation: nextCitation,
								} )
							}
							className="wp-block-pullquote__citation"
							__unstableMobileNoFocusOnMount
							textAlign="center"
							__unstableOnSplitAtEnd={ () =>
								insertBlocksAfter(
									createBlock( 'core/paragraph' )
								)
							}
						/>
					) }
				</BlockQuote>
			</Figure>
		</>
	);
}

export default PullQuoteEdit;
