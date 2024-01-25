/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useDisabled, useMergeRefs } from '@wordpress/compose';
import {
	useSelect,
	withRegistry,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { memo, useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { STORE_NAME as blockEditorStoreName } from '../../store/constants';
import AutoHeightBlockPreview from './auto';
import EditorStyles from '../editor-styles';
import { store as blockEditorStore, storeConfig } from '../../store';
import { __experimentalUpdateSettings } from '../../store/private-actions';
import { resetBlocks } from '../../store/actions';
import { BlockListItems } from '../block-list';

const PreviewProvider = withRegistry( ( props ) => {
	const { children, value, settings, registry } = props;
	// Previews are meant to be static, so create a store and immediately
	// dispatch the settings and blocks so it doesn't call subscribers.
	const subRegistry = useMemo( () => {
		const newRegistry = createRegistry( {}, registry );
		const store = newRegistry.registerStore(
			blockEditorStoreName,
			storeConfig
		);
		store.dispatch( __experimentalUpdateSettings( settings ) );
		store.dispatch( resetBlocks( value ) );
		return newRegistry;
	}, [ registry, value, settings ] );
	return (
		<RegistryProvider value={ subRegistry }>{ children }</RegistryProvider>
	);
} );

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

	const settings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const renderedBlocks = useMemo(
		() => ( Array.isArray( blocks ) ? blocks : [ blocks ] ),
		[ blocks ]
	);

	if ( ! blocks || blocks.length === 0 ) {
		return null;
	}

	return (
		<PreviewProvider value={ renderedBlocks } settings={ settings }>
			<AutoHeightBlockPreview
				viewportWidth={ viewportWidth }
				minHeight={ minHeight }
				additionalStyles={ additionalStyles }
			/>
		</PreviewProvider>
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
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( {
			...originalSettings,
			styles: undefined, // Clear styles included by the parent settings, as they are already output by the parent's EditorStyles.
			__unstableIsPreviewMode: true,
		} ),
		[ originalSettings ]
	);
	const disabledRef = useDisabled();
	const ref = useMergeRefs( [ props.ref, disabledRef ] );
	const renderedBlocks = useMemo(
		() => ( Array.isArray( blocks ) ? blocks : [ blocks ] ),
		[ blocks ]
	);

	const children = (
		<PreviewProvider value={ renderedBlocks } settings={ settings }>
			<EditorStyles />
			<BlockListItems renderAppender={ false } layout={ layout } />
		</PreviewProvider>
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
