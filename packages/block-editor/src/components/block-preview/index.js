/**
 * External dependencies
 */
import { castArray } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalUseDisabled as useDisabled,
	useMergeRefs,
} from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { memo, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import LiveBlockPreview from './live';
import AutoHeightBlockPreview from './auto';
import { store as blockEditorStore } from '../../store';
import { BlockListItems } from '../block-list';

export function BlockPreview( {
	blocks,
	__experimentalPadding = 0,
	viewportWidth = 1200,
	__experimentalLive = false,
	__experimentalOnClick,
} ) {
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo( () => {
		const _settings = { ...originalSettings };
		_settings.__experimentalBlockPatterns = [];
		return _settings;
	}, [ originalSettings ] );
	const renderedBlocks = useMemo( () => castArray( blocks ), [ blocks ] );
	if ( ! blocks || blocks.length === 0 ) {
		return null;
	}
	return (
		<BlockEditorProvider value={ renderedBlocks } settings={ settings }>
			{ __experimentalLive ? (
				<LiveBlockPreview onClick={ __experimentalOnClick } />
			) : (
				<AutoHeightBlockPreview
					viewportWidth={ viewportWidth }
					__experimentalPadding={ __experimentalPadding }
				/>
			) }
		</BlockEditorProvider>
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
 * @return {WPComponent} The component to be rendered.
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
 * @param {Object}    options                      Preview options.
 * @param {WPBlock[]} options.blocks               Block objects.
 * @param {Object}    options.props                Optional. Props to pass to the element. Must contain
 *                                                 the ref if one is defined.
 * @param {Object}    options.__experimentalLayout Layout settings to be used in the preview.
 *
 */
export function useBlockPreview( {
	blocks,
	props = {},
	__experimentalLayout,
} ) {
	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const disabledRef = useDisabled();
	const ref = useMergeRefs( [ props.ref, disabledRef ] );
	const settings = useMemo(
		() => ( { ...originalSettings, __experimentalBlockPatterns: [] } ),
		[ originalSettings ]
	);
	const renderedBlocks = useMemo( () => castArray( blocks ), [ blocks ] );

	const children = (
		<BlockEditorProvider value={ renderedBlocks } settings={ settings }>
			<BlockListItems
				renderAppender={ false }
				__experimentalLayout={ __experimentalLayout }
			/>
		</BlockEditorProvider>
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
