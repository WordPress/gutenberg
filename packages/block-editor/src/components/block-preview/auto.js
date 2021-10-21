/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { useResizeObserver, pure, useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import Iframe from '../iframe';
import EditorStyles from '../editor-styles';
import { store } from '../../store';

// This is used to avoid rendering the block list if the sizes change.
let MemoizedBlockList;

function AutoBlockPreview( { viewportWidth, __experimentalPadding } ) {
	const [
		containerResizeListener,
		{ width: containerWidth },
	] = useResizeObserver();
	const [
		contentResizeListener,
		{ height: contentHeight },
	] = useResizeObserver();
	const styles = useSelect( ( select ) => {
		return select( store ).getSettings().styles;
	}, [] );

	// Initialize on render instead of module top level, to avoid circular dependency issues.
	MemoizedBlockList = MemoizedBlockList || pure( BlockList );

	const scale = containerWidth / viewportWidth;

	// Use iframe content height as the iframe height, but cap it to the arbitrary but reasonable aspect ratio of 1:1
	// see explanation here: https://github.com/WordPress/gutenberg/issues/34729#issuecomment-919949857
	const cappedContentHeight = Math.min( contentHeight, viewportWidth );
	const cappedContentHeightScaled = Math.min(
		contentHeight * scale,
		containerWidth // container width is already scaled
	);

	return (
		<div className="block-editor-block-preview__container">
			{ containerResizeListener }
			<Disabled
				className="block-editor-block-preview__content"
				style={ {
					transform: `scale(${ scale })`,
					height: cappedContentHeightScaled,
				} }
			>
				<Iframe
					head={ <EditorStyles styles={ styles } /> }
					contentRef={ useRefEffect( ( bodyElement ) => {
						const {
							ownerDocument: { documentElement },
						} = bodyElement;
						documentElement.style.position = 'absolute';
						documentElement.style.width = '100%';
						bodyElement.style.padding =
							__experimentalPadding + 'px';
					}, [] ) }
					aria-hidden
					tabIndex={ -1 }
					style={ {
						position: 'absolute',
						width: viewportWidth,
						height: cappedContentHeight,
						pointerEvents: 'none',
					} }
				>
					{ contentResizeListener }
					<MemoizedBlockList renderAppender={ false } />
				</Iframe>
			</Disabled>
		</div>
	);
}

export default AutoBlockPreview;
