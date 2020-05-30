/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes: { orientation } } ) {
	return (
		<div
			className={ classnames( {
				'is-vertical': orientation === 'vertical',
			} ) }
		>
			<InnerBlocks.Content />
		</div>
	);
}
