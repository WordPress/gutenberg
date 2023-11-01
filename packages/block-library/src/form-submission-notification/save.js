/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

/**
 * External dependencies
 */
import classnames from 'classnames';

export default function save( { attributes } ) {
	const { type } = attributes;

	return (
		<div
			{ ...useInnerBlocksProps.save(
				useBlockProps.save( {
					className: classnames(
						'wp-block-form-submission-notification',
						{
							[ `form-notification-type-${ type }` ]: type,
						}
					),
				} )
			) }
		/>
	);
}
