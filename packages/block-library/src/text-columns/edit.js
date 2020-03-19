/**
 * External dependencies
 */
import { get, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl } from '@wordpress/components';
import {
	BlockControls,
	BlockAlignmentToolbar,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import deprecated from '@wordpress/deprecated';

export default function TextColumnsEdit( {
	attributes,
	setAttributes,
	className,
} ) {
	const { width, content, columns } = attributes;

	deprecated( 'The Text Columns block', {
		alternative: 'the Columns block',
		plugin: 'Gutenberg',
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
				className={ `${ className } align${ width } columns-${ columns }` }
			>
				{ times( columns, ( index ) => {
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
								placeholder={ __( 'New Column' ) }
							/>
						</div>
					);
				} ) }
			</div>
		</>
	);
}
