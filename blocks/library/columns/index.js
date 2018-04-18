/**
 * External dependencies
 */
import { times } from 'lodash';
import classnames from 'classnames';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	registerBlockType,
	InspectorControls,
	BlockControls,
	BlockAlignmentToolbar,
	InnerBlocks,
} from '@wordpress/blocks';
import { PanelBody, RangeControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';

/**
 * Returns the layouts configuration for a given number of columns.
 *
 * @param {number} columns Number of columns.
 *
 * @return {Object[]} Columns layout configuration.
 */
const getColumnLayouts = memoize( ( columns ) => {
	return times( columns, ( n ) => ( {
		name: `column-${ n + 1 }`,
		label: sprintf( __( 'Column %d' ), n + 1 ),
		icon: 'columns',
	} ) );
} );

export const name = 'core/columns';

export const settings = {
	title: sprintf(
		/* translators: Block title modifier */
		__( '%1$s (%2$s)' ),
		__( 'Columns' ),
		__( 'Experimental' )
	),

	icon: 'columns',

	category: 'layout',

	attributes: {
		columns: {
			type: 'number',
			default: 2,
		},
		align: {
			type: 'string',
		},
	},

	description: __( 'A multi-column layout of content.' ),

	getEditWrapperProps( attributes ) {
		const { align } = attributes;

		return { 'data-align': align };
	},

	edit( { attributes, setAttributes, className } ) {
		const { align, columns } = attributes;
		const classes = classnames( className, `has-${ columns }-columns` );

		return (
			<Fragment>
				<BlockControls>
					<BlockAlignmentToolbar
						controls={ [ 'wide', 'full' ] }
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</BlockControls>
				<InspectorControls>
					<PanelBody>
						<RangeControl
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ ( nextColumns ) => {
								setAttributes( {
									columns: nextColumns,
								} );
							} }
							min={ 2 }
							max={ 6 }
						/>
					</PanelBody>
				</InspectorControls>
				<div className={ classes }>
					<InnerBlocks layouts={ getColumnLayouts( columns ) } />
				</div>
			</Fragment>
		);
	},

	save( { attributes } ) {
		const { columns } = attributes;

		return (
			<div className={ `has-${ columns }-columns` }>
				<InnerBlocks.Content />
			</div>
		);
	},
};

registerBlockType( name, settings );
