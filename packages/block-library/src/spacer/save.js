/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<div
			{ ...useBlockProps.save( {
				style: { height: attributes.height },
				'aria-hidden': true,
			} ) }
		/>
	);
}
