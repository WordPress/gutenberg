/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( {
	attributes: { contentJustification, orientation },
} ) {
	return (
		<div
			{ ...useInnerBlocksProps.save(
				useBlockProps.save( {
					className: classnames( {
						[ `is-content-justification-${ contentJustification }` ]: contentJustification,
						'is-vertical': orientation === 'vertical',
					} ),
				} )
			) }
		/>
	);
}
