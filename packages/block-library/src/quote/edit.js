/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	AlignmentToolbar,
	BlockControls,
	RichText,
} from '@wordpress/block-editor';

import { BlockQuotation, RangeControl } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

import {
	GlobalStylesControls,
	GlobalStylesPanelBody,
	useGlobalStylesState,
} from '@wordpress/global-styles';

export default function QuoteEdit( {
	attributes,
	setAttributes,
	isSelected,
	mergeBlocks,
	onReplace,
	className,
} ) {
	const { align, value, citation } = attributes;
	const { quoteFontSize, setStyles } = useGlobalStylesState();

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>
			<BlockQuotation
				className={ classnames( className, {
					[ `has-text-align-${ align }` ]: align,
				} ) }
			>
				<RichText
					identifier="value"
					multiline
					value={ value }
					onChange={ ( nextValue ) =>
						setAttributes( {
							value: nextValue,
						} )
					}
					onMerge={ mergeBlocks }
					onRemove={ ( forward ) => {
						const hasEmptyCitation =
							! citation || citation.length === 0;
						if ( ! forward && hasEmptyCitation ) {
							onReplace( [] );
						}
					} }
					placeholder={
						// translators: placeholder text used for the quote
						__( 'Write quote…' )
					}
					onReplace={ onReplace }
					onSplit={ ( piece ) =>
						createBlock( 'core/quote', {
							...attributes,
							value: piece,
						} )
					}
					__unstableOnSplitMiddle={ () =>
						createBlock( 'core/paragraph' )
					}
				/>
				{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
					<RichText
						identifier="citation"
						value={ citation }
						onChange={ ( nextCitation ) =>
							setAttributes( {
								citation: nextCitation,
							} )
						}
						__unstableMobileNoFocusOnMount
						placeholder={
							// translators: placeholder text used for the citation
							__( 'Write citation…' )
						}
						className="wp-block-quote__citation"
					/>
				) }
			</BlockQuotation>
			<GlobalStylesControls>
				<GlobalStylesPanelBody title={ __( 'Quote' ) }>
					<RangeControl
						label={ __( 'Font Size' ) }
						value={ quoteFontSize }
						onChange={ ( nextValue ) =>
							setStyles( { quoteFontSize: nextValue } )
						}
						min={ 10 }
						max={ 50 }
						step={ 1 }
					/>
				</GlobalStylesPanelBody>
			</GlobalStylesControls>
		</>
	);
}
