/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const blockAttributes = {
	verticalAlignment: {
		type: 'string',
	},
	width: {
		type: 'string',
	},
};

const deprecated = [
	{
		attributes: blockAttributes,
		isEligible( attributes ) {
			return attributes.width && ! isNaN( attributes.width );
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
			if ( width ) {
				style = { flexBasis: width };
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
