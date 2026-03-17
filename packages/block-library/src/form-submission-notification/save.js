/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

/**
 * External dependencies
 */
import clsx from 'clsx';

export default function save( { attributes } ) {
	const { type } = attributes;

	return (
		<div
			{ ...useInnerBlocksProps.save(
				useBlockProps.save( {
					className: clsx( 'wp-block-form-submission-notification', {
						[ `form-notification-type-${ type }` ]: type,
					} ),
				} )
			) }
		/>
	);
}
