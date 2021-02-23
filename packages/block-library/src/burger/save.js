/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const { blockId } = attributes;

	return (
		<div { ...blockProps }>
			<label
				htmlFor={ blockId }
				className="wp-block-burger__toggle-button"
			>
				Toggle Menu
			</label>
			<input
				type="checkbox"
				id={ blockId }
				className="wp-block-burger__toggle-status"
			/>
			<div className="wp-block-burger__inner-container">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
