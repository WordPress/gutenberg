/**
 * External dependencies
 */
import { times, range, map } from 'lodash';
import classnames from 'classnames';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
	ButtonGroup,
	Button,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import {
	InspectorControls,
	InnerBlocks,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';
import edit from './edit';

const COLUMNS_TOTAL = 12;
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 6;

/**
 * Returns the layouts configuration for a given number of columns.
 *
 * @param {number} columns Number of columns.
 *
 * @return {Object[]} Columns layout configuration.
 */
const getColumnLayouts = memoize( ( columns, widths ) => {
	let position = 1;

	return times( columns, ( n ) => {
		const startPostion = position;
		position = position + widths[ n ];

		return {
			name: `col${ widths[ n ] } column-start${ startPostion }`,
			label: sprintf( __( 'Column %d' ), n + 1 ),
			icon: 'columns',
		};
	} );
} );

export const name = 'rows/dynamic';

export const settings = {
	title: 'Dynamic row',

	icon: 'columns',

	category: 'rows',

	attributes: {
		columns: {
			type: 'number',
			default: 2,
		},
		widths: {
			type: 'array',
			default: [ 6, 6 ],
		},
	},

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you\'d like.' ),

	supports: {
		align: [ 'wide', 'full' ],
	},

	edit( { attributes, setAttributes, className } ) {
		const { columns, widths } = attributes;
		const classes = classnames( className, 'wp-block-rows' );

		const onColumnsChange = ( nextColumns ) => {
			setAttributes( {
				columns: nextColumns,
			} );
		};

		const onWidthChange = ( index, nextWidth ) => {
			const nextWidths = attributes.widths;
			nextWidths[ index ] = nextWidth;

			console.log( 'nextWidths', nextWidths );

			setAttributes( {
				widths: nextWidths,
			} );
		};

		let partial = 0;

		return (
			<Fragment>
				<InspectorControls>
					<PanelBody>
						<RangeControl
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ ( nextColumns ) => onColumnsChange( nextColumns ) }
							min={ MIN_COLUMNS }
							max={ MAX_COLUMNS }
						/>
					</PanelBody>
					{
						times( columns, ( n ) => {
							const max = COLUMNS_TOTAL - ( partial + ( ( columns - 1 ) * MIN_COLUMNS ) );
							const min = n === columns - 1 ? max : MIN_COLUMNS;

							const availableWidths = range( min, max + 1 );

							partial = partial + ( widths[ n ] - MIN_COLUMNS );

							if ( availableWidths.length === 1 ) {
								onWidthChange( n, availableWidths[ 0 ] );
							}

							return (
								<PanelBody title={ sprintf( __( 'Column %d width' ), n + 1 ) }>
									<ButtonGroup aria-label={ __( 'Column width' ) }>
										{
											map( availableWidths, ( width ) => (
												<Button
													key={ width }
													isSmall
													isPrimary={ widths[ n ] === width }
													aria-pressed={ widths[ n ] === width }
													onClick={ () => onWidthChange( n, width ) }
												>
													{ width }
												</Button>
											) )
										}
									</ButtonGroup>
								</PanelBody>
							);
						} )
					}
				</InspectorControls>
				<div className={ classes }>
					<InnerBlocks layouts={ getColumnLayouts( columns, widths ) } />
				</div>
			</Fragment>
		);
	},

	save() {
		return (
			<div className={ 'wp-block-rows' }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
