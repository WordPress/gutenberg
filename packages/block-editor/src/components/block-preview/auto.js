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
	const { styles, assets } = useSelect( ( select ) => {
		const settings = select( store ).getSettings();
		return {
			styles: settings.styles,
			assets: settings.__unstableResolvedAssets,
		};
	}, [] );

	// Initialize on render instead of module top level, to avoid circular dependency issues.
	MemoizedBlockList = MemoizedBlockList || pure( BlockList );

	const scale = containerWidth / viewportWidth;

	return (
		<div className="block-editor-block-preview__container">
			{ containerResizeListener }
			<Disabled
				className="block-editor-block-preview__content"
				style={ {
					transform: `scale(${ scale })`,
					height: contentHeight * scale,
				} }
			>
				<Iframe
					head={ <EditorStyles styles={ styles } /> }
					assets={ assets }
					contentRef={ useRefEffect( ( bodyElement ) => {
						const {
							ownerDocument: { documentElement },
						} = bodyElement;
						documentElement.classList.add(
							'block-editor-block-preview__content-iframe'
						);
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
						height: contentHeight,
						pointerEvents: 'none',
						// This is a catch-all max-height for patterns.
						// VH units are as tall as your current viewport, and when used inside a scaled iframe
						// the math to convert an inherited VH unit appears to cause it to keep growing endlessly.
						// By applying a max-height, at least it will stop growing.
						// A longer term fix would be to disallow the thumbnail from growing after initial load.
						maxHeight: '1800px',
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
