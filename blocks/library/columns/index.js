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

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import InspectorControls from '../../inspector-controls';
import InnerBlocks from '../../inner-blocks';

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
	},

	supports: {
		align: [ 'wide', 'full' ],
	},

	description: __( 'A multi-column layout of content.' ),

	edit( { attributes, setAttributes, className, focus } ) {
		const { columns } = attributes;
		const classes = classnames( className, `has-${ columns }-columns` );

		return [
			...focus ? [
				<InspectorControls key="inspector">
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
				</InspectorControls>,
			] : [],
			<div className={ classes } key="container">
				<InnerBlocks layouts={ getColumnLayouts( columns ) } />
			</div>,
		];
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
