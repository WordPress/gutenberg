/**
 * External dependencies
 */
import { repeat, identity } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType } from '../../api';
import RangeControl from '../../inspector-controls/range-control';
import InnerBlocks from '../../inner-blocks';
import InspectorControls from '../../inspector-controls';

function mapInnerBlocks( innerBlocks, columns, callback ) {
	return columns.map( ( endOffset, index ) => {
		const startOffset = columns[ index - 1 ] || 0;
		return callback( innerBlocks.slice( startOffset, endOffset ), index );
	} );
}

registerBlockType( 'core/columns', {
	title: __( 'Columns' ),

	icon: 'columns',

	category: 'layout',

	attributes: {
		columns: {
			type: 'array',
			default: [ 1, 2 ],
		},
	},

	description: __( 'A multi-column layout of content.' ),

	getEditWrapperProps() {
		return { 'data-align': 'wide' };
	},

	edit( { attributes, setAttributes, setInnerBlocks, innerBlocks, className, focus } ) {
		const { columns } = attributes;

		// TODO: Refactor setInnerBlockFragment to be less awful, separated, tested.

		const setInnerBlockFragment = ( index ) => ( nextInnerBlocks ) => {
			const fragmented = mapInnerBlocks( innerBlocks, columns, identity );
			const origNumInnerBlocks = fragmented[ index ].length;
			fragmented.splice( index, 1, nextInnerBlocks );

			let runningOffset = 0;
			const nextColumns = [];
			const allNextInnerBlocks = [];
			fragmented.forEach( ( innerBlockSet, innerBlockSetIndex ) => {
				runningOffset += innerBlockSet.length;
				if ( innerBlockSetIndex > index ) {
					runningOffset += nextInnerBlocks.length - origNumInnerBlocks;
				}

				nextColumns.push( runningOffset );
				allNextInnerBlocks.push( ...innerBlockSet );
			} );

			setAttributes( { columns: nextColumns } );
			setInnerBlocks( allNextInnerBlocks );
		};

		const setNextColumnsCount = ( count ) => {
			const nextColumns = count < columns.length ?
				// Take first X of columns...
				columns.slice( 0, count ) :
				// ...or fill with new columns
				[ ...columns, repeat( count - columns.length, () => [] ) ];

			if ( count < columns.length ) {
				// When trimming columns, reassign inner blocks to include only
				// those up to the now-last column.

				// TODO: Ideally we'd simply flatten eliminated columns into
				// the last available column, which is simply assigning the new
				// last column to have inner blocks length as its final offset,
				// but this is made difficult by the fact that we'd need to
				// reset the block state of the rendered InnerBlocks.
				const lastInnerBlockIndex = nextColumns[ nextColumns.length - 1 ];
				setInnerBlocks( innerBlocks.slice( 0, lastInnerBlockIndex ) );
			}

			setAttributes( { columns: nextColumns } );
		};

		return [
			focus && (
				<InspectorControls key="inspector">
					<RangeControl
						label={ __( 'Columns' ) }
						value={ columns.length }
						onChange={ setNextColumnsCount }
						min={ 2 }
						max={ 4 }
					/>
				</InspectorControls>
			),
			<div className={ className } key="container">
				{ mapInnerBlocks( innerBlocks, columns, ( innerBlockSet, index ) => (
					<InnerBlocks
						key={ index }
						value={ innerBlockSet }
						onChange={ setInnerBlockFragment( index ) }
					/>
				) ) }
			</div>,
		];
	},

	save( { attributes, innerBlocks } ) {
		const { columns } = attributes;

		return (
			<div>
				{ mapInnerBlocks( innerBlocks, columns, ( innerBlockSet, index ) => (
					<InnerBlocks.Content
						key={ index }
						value={ innerBlockSet }
					/>
				) ) }
			</div>
		);
	},
} );
