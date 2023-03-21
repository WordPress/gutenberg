/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { PanelBody, RangeControl } from '@wordpress/components';
import {
	BlockControls,
	BlockAlignmentToolbar,
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import deprecated from '@wordpress/deprecated';

export default function TextColumnsEdit( { attributes, setAttributes } ) {
	const { width, content, columns } = attributes;

	deprecated( 'The Text Columns block', {
		since: '5.3',
		alternative: 'the Columns block',
	} );

	return (
		<>
			<BlockControls>
				<BlockAlignmentToolbar
					value={ width }
					onChange={ ( nextWidth ) =>
						setAttributes( { width: nextWidth } )
					}
					controls={ [ 'center', 'wide', 'full' ] }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody>
					<RangeControl
						__nextHasNoMarginBottom
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ ( value ) =>
							setAttributes( { columns: value } )
						}
						min={ 2 }
						max={ 4 }
						required
					/>
				</PanelBody>
			</InspectorControls>
			<div
				{ ...useBlockProps( {
					className: `align${ width } columns-${ columns }`,
				} ) }
			>
				{ Array.from( { length: columns } ).map( ( _, index ) => {
					return (
						<div
							className="wp-block-column"
							key={ `column-${ index }` }
						>
							<RichText
								tagName="p"
								value={ get( content, [ index, 'children' ] ) }
								onChange={ ( nextContent ) => {
									setAttributes( {
										content: [
											...content.slice( 0, index ),
											{ children: nextContent },
											...content.slice( index + 1 ),
										],
									} );
								} }
								aria-label={ sprintf(
									// translators: %d: column index (starting with 1)
									__( 'Column %d text' ),
									index + 1
								) }
								placeholder={ __( 'New Column' ) }
							/>
						</div>
					);
				} ) }
			</div>
		</>
	);
}
