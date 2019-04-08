/**
 * External dependencies
 */
import { get, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './edit';

/**
 * Internal dependencies
 */
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	// Disable insertion as this block is deprecated and ultimately replaced by the Columns block.
	supports: {
		inserter: false,
	},

	title: __( 'Text Columns (deprecated)' ),

	description: __( 'This block is deprecated. Please use the Columns block instead.' ),

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

	edit,

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
