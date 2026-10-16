import clsx from 'clsx';
import { useDisabled, useMergeRefs } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { memo, useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import type { MemoExoticComponent, Ref } from 'react';
import type { Block } from '@wordpress/blocks';
import { ExperimentalBlockEditorProvider } from '../provider';
import AutoHeightBlockPreview from './auto';
import EditorStyles from '../editor-styles';
import { store as blockEditorStore } from '../../store';
import { BlockListItems } from '../block-list';
import { Async } from './async';
import type { EditorStylesStyle } from '../editor-styles/types';
import type { BlockPreviewProps, UseBlockPreviewOptions } from './types';

const EMPTY_ADDITIONAL_STYLES: EditorStylesStyle[] = [];

export function BlockPreview( {
	blocks,
	viewportWidth = 1200,
	minHeight,
	additionalStyles = EMPTY_ADDITIONAL_STYLES,
	// Deprecated props:
	__experimentalMinHeight,
	__experimentalPadding,
}: BlockPreviewProps ) {
	if ( __experimentalMinHeight ) {
		minHeight = __experimentalMinHeight;
		deprecated( 'The __experimentalMinHeight prop', {
			since: '6.2',
			version: '6.4',
			alternative: 'minHeight',
		} );
	}
	if ( __experimentalPadding ) {
		additionalStyles = [
			...additionalStyles,
			{ css: `body { padding: ${ __experimentalPadding }px; }` },
		];
		deprecated( 'The __experimentalPadding prop of BlockPreview', {
			since: '6.2',
			version: '6.4',
			alternative: 'additionalStyles',
		} );
	}

	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( {
			...originalSettings,
			isPreviewMode: true,
		} ),
		[ originalSettings ]
	);
	const renderedBlocks = useMemo(
		() => ( Array.isArray( blocks ) ? blocks : [ blocks ] ),
		[ blocks ]
	);

	// A single block has no length.
	if ( ! blocks || ( blocks as Block[] ).length === 0 ) {
		return null;
	}

	return (
		<ExperimentalBlockEditorProvider
			// The preview renders only with blocks.
			value={ renderedBlocks as Block[] }
			settings={ settings }
		>
			<AutoHeightBlockPreview
				viewportWidth={ viewportWidth }
				minHeight={ minHeight }
				additionalStyles={ additionalStyles }
			/>
		</ExperimentalBlockEditorProvider>
	);
}

// `Async` is attached below.
const MemoizedBlockPreview = memo( BlockPreview ) as MemoExoticComponent<
	typeof BlockPreview
> & { Async: typeof Async };

MemoizedBlockPreview.Async = Async;

/**
 * BlockPreview renders a preview of a block or array of blocks.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-preview/README.md
 *
 * @param {Object}       preview               options for how the preview should be shown
 * @param {Array|Object} preview.blocks        A block instance (object) or an array of blocks to be previewed.
 * @param {number}       preview.viewportWidth Width of the preview container in pixels. Controls at what size the blocks will be rendered inside the preview. Default: 700.
 *
 * @return {Component} The component to be rendered.
 */
export default MemoizedBlockPreview;

/**
 * This hook is used to lightly mark an element as a block preview wrapper
 * element. Call this hook and pass the returned props to the element to mark as
 * a block preview wrapper, automatically rendering inner blocks as children. If
 * you define a ref for the element, it is important to pass the ref to this
 * hook, which the hook in turn will pass to the component through the props it
 * returns. Optionally, you can also pass any other props through this hook, and
 * they will be merged and returned.
 *
 * @param options        Preview options.
 * @param options.blocks Block objects.
 * @param options.props  Optional. Props to pass to the element. Must contain
 *                       the ref if one is defined.
 * @param options.layout Layout settings to be used in the preview.
 */
export function useBlockPreview( {
	blocks,
	props = {},
	layout,
}: UseBlockPreviewOptions ) {
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( {
			...originalSettings,
			styles: undefined, // Clear styles included by the parent settings, as they are already output by the parent's EditorStyles.
			isPreviewMode: true,
		} ),
		[ originalSettings ]
	);
	const disabledRef = useDisabled();
	// `useMergeRefs` skips a missing ref.
	const ref = useMergeRefs( [
		props.ref as Ref< HTMLElement >,
		disabledRef,
	] );
	const renderedBlocks = useMemo(
		() => ( Array.isArray( blocks ) ? blocks : [ blocks ] ),
		[ blocks ]
	);

	const children = (
		<ExperimentalBlockEditorProvider
			value={ renderedBlocks }
			settings={ settings }
		>
			<EditorStyles />
			<BlockListItems renderAppender={ false } layout={ layout } />
		</ExperimentalBlockEditorProvider>
	);

	return {
		...props,
		ref,
		className: clsx(
			props.className,
			'block-editor-block-preview__live-content'
		),
		// A single block has no length.
		children: ( blocks as Block[] )?.length ? children : null,
	};
}
