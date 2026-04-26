/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			{ /* data-wp-each iterates state.dots (array of indexes) at runtime.
			     Each iteration exposes context.item as the dot's 0-based index. */ }
			<template data-wp-each="state.dots" data-wp-each-key="context.item">
				<button
					type="button"
					className="wp-block-slider-pagination-indicator__dot"
					data-wp-on--click="actions.goToSlide"
					data-wp-bind--aria-current="state.isDotActive"
					data-wp-bind--aria-label="state.dotLabel"
				/>
			</template>
		</div>
	);
}
