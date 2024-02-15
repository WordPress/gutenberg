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
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Figure } from './figure';
import { BlockQuote } from './blockquote';
import { Caption } from '../utils/caption';

const isWebPlatform = Platform.OS === 'web';

function PullQuoteEdit( {
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
} ) {
	const { textAlign, value } = attributes;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

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
						tagName="p"
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
					<Caption
						attributeKey="citation"
						tagName={ isWebPlatform ? 'cite' : undefined }
						style={ { display: 'block' } }
						isSelected={ isSelected }
						attributes={ attributes }
						setAttributes={ setAttributes }
						label={ __( 'Pullquote citation text' ) }
						placeholder={
							// translators: placeholder text used for the citation
							__( 'Add citation' )
						}
						addLabel={ __( 'Add citation' ) }
						removeLabel={ __( 'Remove citation' ) }
						className="wp-block-pullquote__citation"
						__unstableMobileNoFocusOnMount
						textAlign="center"
						insertBlocksAfter={ insertBlocksAfter }
					/>
				</BlockQuote>
			</Figure>
		</>
	);
}

export default PullQuoteEdit;
