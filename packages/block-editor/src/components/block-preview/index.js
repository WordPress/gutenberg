/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useDisabled, useMergeRefs } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { memo, useEffect, useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { ExperimentalBlockEditorProvider } from '../provider';
import AutoHeightBlockPreview from './auto';
import { store as blockEditorStore } from '../../store';
import { BlockListItems } from '../block-list';
import { unlock } from '../../lock-unlock';

export function BlockPreview( {
	blocks,
	viewportWidth = 1200,
	minHeight,
	additionalStyles = [],
	// Deprecated props:
	__experimentalMinHeight,
	__experimentalPadding,
} ) {
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
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
	);
	const renderedBlocks = useMemo(
		() => ( Array.isArray( blocks ) ? blocks : [ blocks ] ),
		[ blocks ]
	);

	if ( ! blocks || blocks.length === 0 ) {
		return null;
	}

	return (
		<ExperimentalBlockEditorProvider
			value={ renderedBlocks }
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
export default memo( BlockPreview );

/**
 * Syncs style overrides with the parent component. This allows a child of
 * an `ExperimentalBlockEditorProvider` to sync its internal style overrides with
 * the parent store.
 *
 * @param {Object}   props                        The component props.
 * @param {Map}      props.parentStyleOverrides   The parent style overrides.
 * @param {Function} props.setParentStyleOverride The parent's function to set a style override.
 */
function SyncStyleOverridesWithParent( {
	parentStyleOverrides,
	setParentStyleOverride,
} ) {
	const overrides = useSelect(
		( select ) => unlock( select( blockEditorStore ) ).getStyleOverrides(),
		[]
	);

	useEffect( () => {
		for ( const [ id, override ] of overrides ) {
			if ( parentStyleOverrides.get( id ) !== override ) {
				setParentStyleOverride( id, override );
			}
		}
	}, [ overrides, parentStyleOverrides, setParentStyleOverride ] );
}

/**
 * This hook is used to lightly mark an element as a block preview wrapper
 * element. Call this hook and pass the returned props to the element to mark as
 * a block preview wrapper, automatically rendering inner blocks as children. If
 * you define a ref for the element, it is important to pass the ref to this
 * hook, which the hook in turn will pass to the component through the props it
 * returns. Optionally, you can also pass any other props through this hook, and
 * they will be merged and returned.
 *
 * @param {Object}    options        Preview options.
 * @param {WPBlock[]} options.blocks Block objects.
 * @param {Object}    options.props  Optional. Props to pass to the element. Must contain
 *                                   the ref if one is defined.
 * @param {Object}    options.layout Layout settings to be used in the preview.
 */
export function useBlockPreview( { blocks, props = {}, layout } ) {
	const { setStyleOverride } = unlock( useDispatch( blockEditorStore ) );
	const parentStyleOverrides = useSelect(
		( select ) => unlock( select( blockEditorStore ) ).getStyleOverrides(),
		[]
	);
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
	);
	const disabledRef = useDisabled();
	const ref = useMergeRefs( [ props.ref, disabledRef ] );
	const renderedBlocks = useMemo(
		() => ( Array.isArray( blocks ) ? blocks : [ blocks ] ),
		[ blocks ]
	);

	const children = (
		<ExperimentalBlockEditorProvider
			value={ renderedBlocks }
			settings={ settings }
		>
			<SyncStyleOverridesWithParent
				parentStyleOverrides={ parentStyleOverrides }
				setParentStyleOverride={ setStyleOverride }
			/>
			<BlockListItems renderAppender={ false } layout={ layout } />
		</ExperimentalBlockEditorProvider>
	);

	return {
		...props,
		ref,
		className: classnames(
			props.className,
			'block-editor-block-preview__live-content',
			'components-disabled'
		),
		children: blocks?.length ? children : null,
	};
}
