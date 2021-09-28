/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( {
	attributes: { contentJustification, orientation },
} ) {
	return (
		<div
			{ ...useBlockProps.save( {
				className: classnames( {
					[ `is-content-justification-${ contentJustification }` ]: contentJustification,
					'is-vertical': orientation === 'vertical',
				} ),
			} ) }
		>
			<InnerBlocks.Content />
		</div>
	);
}
