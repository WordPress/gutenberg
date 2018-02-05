/**
 * External dependencies
 */
import { times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import RangeControl from '../../inspector-controls/range-control';
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

	edit( { attributes, setAttributes, className, isSelected } ) {
		const { width, content, columns } = attributes;

		return [
			isSelected && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ width }
						onChange={ ( nextWidth ) => setAttributes( { width: nextWidth } ) }
						controls={ [ 'center', 'wide', 'full' ] }
					/>
				</BlockControls>
			),
			isSelected && (
				<InspectorControls key="inspector">
					<RangeControl
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ ( value ) => setAttributes( { columns: value } ) }
						min={ 2 }
						max={ 4 }
					/>
				</InspectorControls>
			),
			<div className={ `${ className } align${ width } columns-${ columns }` } key="block">
				{ times( columns, ( index ) =>
					<div className="wp-block-column" key={ `column-${ index }` }>
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
						/>
					</div>
				) }
			</div>,
		];
	},

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
