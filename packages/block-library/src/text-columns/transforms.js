/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/columns' ],
			convert: ( { attributes: { className, columns, content, width } } ) => (
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
};

export default transforms;
