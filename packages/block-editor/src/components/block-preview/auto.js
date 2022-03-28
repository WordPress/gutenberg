/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { useResizeObserver, pure, useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import Iframe from '../iframe';
import EditorStyles from '../editor-styles';
import { store } from '../../store';

// This is used to avoid rendering the block list if the sizes change.
let MemoizedBlockList;

const MAX_HEIGHT = 2000;

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

	// Avoid scrollbars for pattern previews.
	const editorStyles = useMemo( () => {
		if ( styles ) {
			return [
				...styles,
				{
					css: 'body{height:auto;overflow:hidden;}',
					__unstableType: 'presets',
				},
			];
		}

		return styles;
	}, [ styles ] );

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
					maxHeight:
						contentHeight > MAX_HEIGHT
							? MAX_HEIGHT * scale
							: undefined,
				} }
			>
				<Iframe
					head={ <EditorStyles styles={ editorStyles } /> }
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

						// necessary for contentResizeListener to work.
						bodyElement.style.position = 'relative';
					}, [] ) }
					aria-hidden
					tabIndex={ -1 }
					style={ {
						position: 'absolute',
						width: viewportWidth,
						height: contentHeight,
						pointerEvents: 'none',
						// This is a catch-all max-height for patterns.
						// See: https://github.com/WordPress/gutenberg/pull/38175.
						maxHeight: MAX_HEIGHT,
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
