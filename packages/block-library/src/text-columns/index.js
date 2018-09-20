/**
 * External dependencies
 */
import { get, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import {
	BlockControls,
	BlockAlignmentToolbar,
	InspectorControls,
	RichText,
} from '@wordpress/editor';
import deprecated from '@wordpress/deprecated';
import { createValue } from '@wordpress/rich-text-value';

export const name = 'core/text-columns';

export const settings = {
	// Disable insertion as this block is deprecated and ultimately replaced by the Columns block.
	supports: {
		inserter: false,
	},

	title: __( 'Text Columns (deprecated)' ),

	description: __( 'This block is deprecated. Please use the Columns block instead.' ),

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
			default: [
				{
					children: createValue(),
				},
				{
					children: createValue(),
				},
			],
		},
		columns: {
			type: 'number',
			default: 2,
		},
		width: {
			type: 'string',
		},
	},

	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'core/columns' ],
				transform: ( { className, columns, content, width } ) => (
					createBlock(
						'core/columns',
						{
							align: ( 'wide' === width || 'full' === width ) ? width : undefined,
							className,
							columns,
						},
						content.map( ( { children } ) =>
							createBlock(
								'core/column',
								{},
								[ createBlock( 'core/paragraph', { content: children } ) ]
							)
						)
					)
				),
			},
		],
	},

	getEditWrapperProps( attributes ) {
		const { width } = attributes;
		if ( 'wide' === width || 'full' === width ) {
			return { 'data-align': width };
		}
	},

	edit: ( ( { attributes, setAttributes, className } ) => {
		const { width, content, columns } = attributes;

		deprecated( 'The Text Columns block', {
			alternative: 'the Columns block',
			plugin: 'Gutenberg',
		} );

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
						return (
							<div className="wp-block-column" key={ `column-${ index }` }>
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
			</Fragment>
		);
	} ),

	save( { attributes } ) {
		const { width, content, columns } = attributes;
		return (
			<div className={ `align${ width } columns-${ columns }` }>
				{ times( columns, ( index ) =>
					<div className="wp-block-column" key={ `column-${ index }` }>
						<RichText.Content tagName="p" value={ get( content, [ index, 'children' ] ) } />
					</div>
				) }
			</div>
		);
	},
};
