/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const deprecated = [
	{
		attributes: {
			verticalAlignment: {
				type: 'string',
			},
			width: {
				type: 'number',
				min: 0,
				max: 100,
			},
		},
		isEligible( { width } ) {
			return isFinite( width );
		},
		migrate( attributes ) {
			return {
				...attributes,
				width: `${ attributes.width }%`,
			};
		},
		save( { attributes } ) {
			const { verticalAlignment, width } = attributes;

			const wrapperClasses = clsx( {
				[ `is-vertically-aligned-${ verticalAlignment }` ]:
					verticalAlignment,
			} );

			const style = { flexBasis: width + '%' };

			return (
				<div className={ wrapperClasses } style={ style }>
					<InnerBlocks.Content />
				</div>
			);
		},
	},
];

export default deprecated;
