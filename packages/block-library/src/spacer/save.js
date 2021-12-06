/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( {
	attributes: { height, heightUnit, width, widthUnit },
} ) {
	const style = {
		height: height && heightUnit ? `${ height }${ heightUnit }` : undefined,
		width: width && widthUnit ? `${ width }${ widthUnit }` : undefined,
	};

	return (
		<div
			{ ...useBlockProps.save( {
				style,
				'aria-hidden': true,
			} ) }
		/>
	);
}
