/**
 * External dependencies
 */
import classnames from 'classnames';

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
		migrate( attributes ) {
			return {
				...attributes,
				width: `${ attributes.width }%`,
			};
		},
		save( { attributes } ) {
			const { verticalAlignment, width } = attributes;

			const wrapperClasses = classnames( {
				[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
			} );

			let style;
			if ( Number.isFinite( width ) ) {
				style = { flexBasis: width + '%' };
			}

			return (
				<div className={ wrapperClasses } style={ style }>
					<InnerBlocks.Content />
				</div>
			);
		},
	},
];

export default deprecated;
