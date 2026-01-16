/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save( {
		className: 'wp-block-slider-track',
		'data-wp-interactive': 'core/slider',
		'data-wp-context': '{}',
		'data-wp-on--scroll': 'actions.handleScroll',
		'data-wp-init': 'callbacks.initTrack',
		'data-wp-watch': 'callbacks.updateTrack',
	} );

	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>;
}
