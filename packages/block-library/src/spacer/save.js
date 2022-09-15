/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes: { height, width } } ) {
	return (
		<div
			{ ...useBlockProps.save( {
				style: {
					height,
					width,
				},
				'aria-hidden': true,
			} ) }
		/>
	);
}
