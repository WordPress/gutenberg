/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

const deprecated = [
	{
		attributes: {
			height: {
				type: 'number',
				default: 100,
			},
			width: {
				type: 'number',
			},
		},
		migrate( attributes ) {
			const { height, width } = attributes;
			return {
				...attributes,
				width: width !== undefined ? `${ width }px` : undefined,
				height: height !== undefined ? `${ height }px` : undefined,
			};
		},
		save( { attributes } ) {
			return (
				<div
					{ ...useBlockProps.save( {
						style: {
							height: attributes.height,
							width: attributes.width,
						},
						'aria-hidden': true,
					} ) }
				/>
			);
		},
	},
];

export default deprecated;
