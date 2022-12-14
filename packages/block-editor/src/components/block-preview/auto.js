/**
 * WordPress dependencies
 */
import { useResizeObserver, pure, useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { Disabled } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import Iframe from '../iframe';
import EditorStyles from '../editor-styles';
import { __unstablePresetDuotoneFilter as PresetDuotoneFilter } from '../../components/duotone';
import { store } from '../../store';

// This is used to avoid rendering the block list if the sizes change.
let MemoizedBlockList;

const MAX_HEIGHT = 2000;

function ScaledBlockPreview( {
	viewportWidth,
	containerWidth,
	__experimentalPadding,
	__experimentalMinHeight,
	__experimentalStyles,
} ) {
	if ( ! viewportWidth ) {
		viewportWidth = containerWidth;
	}

	const [ contentResizeListener, { height: contentHeight } ] =
		useResizeObserver();
	const { styles, assets, duotone } = useSelect( ( select ) => {
		const settings = select( store ).getSettings();
		return {
			styles: settings.styles,
			assets: settings.__unstableResolvedAssets,
			duotone: settings.__experimentalFeatures?.color?.duotone,
		};
	}, [] );

	// Avoid scrollbars for pattern previews.
	const editorStyles = useMemo( () => {
		if ( styles ) {
			return [
				...styles,
				...__experimentalStyles,
				{
					css: 'body{height:auto;overflow:hidden;}',
					__unstableType: 'presets',
				},
			];
		}

		return styles;
	}, [ styles, __experimentalStyles ] );

	const svgFilters = useMemo( () => {
		return [ ...( duotone?.default ?? [] ), ...( duotone?.theme ?? [] ) ];
	}, [ duotone ] );

	// Initialize on render instead of module top level, to avoid circular dependency issues.
	MemoizedBlockList = MemoizedBlockList || pure( BlockList );

	const scale = containerWidth / viewportWidth;
	return (
		<Disabled
			className="block-editor-block-preview__content"
			style={ {
				transform: `scale(${ scale })`,
				height: contentHeight * scale,
				maxHeight:
					contentHeight > MAX_HEIGHT ? MAX_HEIGHT * scale : undefined,
				minHeight: __experimentalMinHeight,
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
					bodyElement.style.padding = __experimentalPadding + 'px';

					// Necessary for contentResizeListener to work.
					bodyElement.style.boxSizing = 'border-box';
					bodyElement.style.position = 'absolute';
					bodyElement.style.width = '100%';
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
					minHeight:
						scale !== 0 && scale < 1 && __experimentalMinHeight
							? __experimentalMinHeight / scale
							: __experimentalMinHeight,
				} }
			>
				{ contentResizeListener }
				{
					/* Filters need to be rendered before children to avoid Safari rendering issues. */
					svgFilters.map( ( preset ) => (
						<PresetDuotoneFilter
							preset={ preset }
							key={ preset.slug }
						/>
					) )
				}
				<MemoizedBlockList renderAppender={ false } />
			</Iframe>
		</Disabled>
	);
}

export default function AutoBlockPreview( props ) {
	const [ containerResizeListener, { width: containerWidth } ] =
		useResizeObserver();

	return (
		<>
			<div style={ { position: 'relative', width: '100%', height: 0 } }>
				{ containerResizeListener }
			</div>
			<div className="block-editor-block-preview__container">
				{ !! containerWidth && (
					<ScaledBlockPreview
						{ ...props }
						containerWidth={ containerWidth }
					/>
				) }
			</div>
		</>
	);
}
