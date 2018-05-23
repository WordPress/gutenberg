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
import { PanelBody, RangeControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import {
	InspectorControls,
	InnerBlocks,
} from '@wordpress/editor';

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
		__( 'beta' )
	),

	icon: 'columns',

	category: 'layout',

	attributes: {
		columns: {
			type: 'number',
			default: 2,
		},
	},

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you\'d like.' ),

	supports: {
		align: [ 'wide', 'full' ],
	},

	edit( { attributes, setAttributes, className } ) {
		const { columns } = attributes;
		const classes = classnames( className, `has-${ columns }-columns` );

		return (
			<Fragment>
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
