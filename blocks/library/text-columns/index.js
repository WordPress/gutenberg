/**
 * External dependencies
 */
import { times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl, withState } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import RichText from '../../rich-text';
import InspectorControls from '../../inspector-controls';

export const name = 'core/text-columns';

export const settings = {
	title: __( 'Text Columns' ),

	description: __( 'Add text across columns. This block is experimental' ),

	icon: 'columns',

	category: 'layout',

	attributes: {
		content: {
			type: 'array',
			source: 'query',
			selector: 'p',
			query: {
				children: {
					source: 'children',
				},
			},
			default: [ [], [] ],
		},
		columns: {
			type: 'number',
			default: 2,
		},
		width: {
			type: 'string',
		},
	},

	getEditWrapperProps( attributes ) {
		const { width } = attributes;
		if ( 'wide' === width || 'full' === width ) {
			return { 'data-align': width };
		}
	},

	edit: withState( {
		editable: 'column-1',
	} )( ( { attributes, setAttributes, className, isSelected, editable, setState } ) => {
		const { width, content, columns } = attributes;
		const onSetActiveEditable = ( newEditable ) => () => {
			setState( { editable: newEditable } );
		};

		return (
			<Fragment>
				<BlockControls>
					<BlockAlignmentToolbar
						value={ width }
						onChange={ ( nextWidth ) => setAttributes( { width: nextWidth } ) }
						controls={ [ 'center', 'wide', 'full' ] }
					/>
				</BlockControls>
				<InspectorControls>
					<PanelBody>
						<RangeControl
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ ( value ) => setAttributes( { columns: value } ) }
							min={ 2 }
							max={ 4 }
						/>
					</PanelBody>
				</InspectorControls>
				<div className={ `${ className } align${ width } columns-${ columns }` }>
					{ times( columns, ( index ) => {
						const key = `column-${ index }`;
						return (
							<div className="wp-block-column" key={ key }>
								<RichText
									tagName="p"
									value={ content && content[ index ] && content[ index ].children }
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
									isSelected={ isSelected && editable === key }
									onFocus={ onSetActiveEditable( key ) }
								/>
							</div>
						);
					} ) }
				</div>
			</Fragment>
		);
	} ),

	save( { attributes } ) {
		const { width, content, columns } = attributes;
		return (
			<div className={ `align${ width } columns-${ columns }` }>
				{ times( columns, ( index ) =>
					<div className="wp-block-column" key={ `column-${ index }` }>
						<p>{ content && content[ index ].children }</p>
					</div>
				) }
			</div>
		);
	},
};
