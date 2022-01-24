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
					height: contentHeight * scale,
					width: '100%',
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
					}, [] ) }
					aria-hidden
					tabIndex={ -1 }
					style={ {
						position: 'absolute',
						width: viewportWidth,
						height: contentHeight,
						transform: `scale(${ scale })`,
						transformOrigin: 'top left',
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
