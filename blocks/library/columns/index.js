/**
 * External dependencies
 */
import { times } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType } from '../../api';
import RangeControl from '../../inspector-controls/range-control';
import InspectorControls from '../../inspector-controls';
import InnerBlocks from '../../inner-blocks';

registerBlockType( 'core/columns', {
	title: __( 'Columns' ),

	icon: 'columns',

	category: 'layout',

	attributes: {
		columns: {
			type: 'number',
			default: 2,
		},
	},

	description: __( 'A multi-column layout of content.' ),

	edit( { attributes, setAttributes, className, focus } ) {
		const { columns } = attributes;
		const classes = classnames( className, `has-${ columns }-columns` );

		// Define columns as a set of layouts within the inner block list. This
		// will enable the user to move blocks between columns, and will apply
		// a layout-specific class name to the rendered output which can be
		// styled by the columns wrapper to visually place the columns.
		const layouts = times( columns, ( n ) => ( {
			name: `column-${ n + 1 }`,
			label: sprintf( __( 'Column %d' ), n + 1 ),
			icon: 'columns',
		} ) );

		return [
			focus && (
				<InspectorControls key="inspector">
					<RangeControl
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ ( nextColumns ) => {
							setAttributes( {
								columns: nextColumns,
							} );
						} }
						min={ 2 }
						max={ 4 }
					/>
				</InspectorControls>
			),
			<div className={ classes } key="container">
				<InnerBlocks layouts={ layouts } />
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
} );
