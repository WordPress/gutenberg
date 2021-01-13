/**
 * WordPress dependencies
 */
import { useResizeObserver, pure } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import Iframe from '../iframe';

// This is used to avoid rendering the block list if the sizes change.
let MemoizedBlockList;

function AutoBlockPreview( { viewportWidth } ) {
	const [
		containerResizeListener,
		{ width: containerWidth },
	] = useResizeObserver();
	const [
		contentResizeListener,
		{ height: contentHeight },
	] = useResizeObserver();

	// Initialize on render instead of module top level, to avoid circular dependency issues.
	MemoizedBlockList = MemoizedBlockList || pure( BlockList );

	const scale = containerWidth / viewportWidth;

	return (
		<div className="block-editor-block-preview__container">
			{ containerResizeListener }
			<div
				className="block-editor-block-preview__content"
				style={ {
					transform: `scale(${ scale })`,
					height: contentHeight * scale,
				} }
			>
				<Iframe
					contentRef={ ( body ) => {
						body.style.position = 'absolute';
					} }
					aria-hidden
					style={ {
						width: viewportWidth,
						height: contentHeight,
						pointerEvents: 'none',
					} }
				>
					{ contentResizeListener }
					<MemoizedBlockList />
				</Iframe>
			</div>
		</div>
	);
}

export default AutoBlockPreview;
