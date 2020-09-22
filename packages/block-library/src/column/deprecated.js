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
		isEligible( attributes ) {
			return attributes.width && 'string' !== typeof attributes.width;
		},
		save( { attributes } ) {
			attributes.width = `${attributes.width}%`;
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
	{
		attributes: {
			verticalAlignment: {
				type: 'string',
			},
			width: {
				type: 'string',
			},
		},
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
