/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( {
	attributes: { height, heightUnit, width, widthUnit },
} ) {
	const heightWithUnit = heightUnit ? `${ height }${ heightUnit }` : height;
	const widthWithUnit = widthUnit ? `${ width }${ widthUnit }` : width;

	return (
		<div
			{ ...useBlockProps.save( {
				style: {
					height: height !== undefined ? heightWithUnit : undefined,
					width: width !== undefined ? widthWithUnit : undefined,
				},
				'aria-hidden': true,
			} ) }
		/>
	);
}
