/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';

function AutoBlockPreview( { viewportWidth } ) {
	const [
		containerResizeListener,
		{ width: containerWidth },
	] = useResizeObserver();
	const [
		containtResizeListener,
		{ height: contentHeight },
	] = useResizeObserver();

	return (
		<div
			className="block-editor-block-preview__container editor-styles-wrapper is-auto-height"
			aria-hidden
			style={ {
				height: ( contentHeight * containerWidth ) / viewportWidth,
			} }
		>
			{ containerResizeListener }
			<Disabled
				style={ {
					transform: `scale(${ containerWidth / viewportWidth })`,
					width: viewportWidth,
				} }
				className="block-editor-block-preview__content"
			>
				{ containtResizeListener }
				<BlockList />
			</Disabled>
		</div>
	);
}

export default AutoBlockPreview;
