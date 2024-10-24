/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useMemo, memo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	getBlockSupport,
	store as blocksStore,
	__unstableGetInnerBlocksProps as getInnerBlocksProps,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ButtonBlockAppender from './button-block-appender';
import DefaultBlockAppender from './default-block-appender';
import useNestedSettingsUpdate from './use-nested-settings-update';
import useInnerBlockTemplateSync from './use-inner-block-template-sync';
import useBlockContext from './use-block-context';
import { BlockListItems } from '../block-list';
import { BlockContextProvider } from '../block-context';
import { useBlockEditContext } from '../block-edit/context';
import useBlockSync from '../provider/use-block-sync';
import { store as blockEditorStore } from '../../store';
import useBlockDropZone from '../use-block-drop-zone';
import { unlock } from '../../lock-unlock';

const EMPTY_OBJECT = {};

function BlockContext( { children, clientId } ) {
	const context = useBlockContext( clientId );
	return (
		<BlockContextProvider value={ context }>
			{ children }
		</BlockContextProvider>
	);
}

const BlockListItemsMemo = memo( BlockListItems );

/**
 * InnerBlocks is a component which allows a single block to have multiple blocks
 * as children. The UncontrolledInnerBlocks component is used whenever the inner
 * blocks are not controlled by another entity. In other words, it is normally
 * used for inner blocks in the post editor
 *
 * @param {Object} props The component props.
 */
function UncontrolledInnerBlocks( props ) {
	const {
		clientId,
		allowedBlocks,
		prioritizedInserterBlocks,
		defaultBlock,
		directInsert,
		__experimentalDefaultBlock,
		__experimentalDirectInsert,
		template,
		templateLock,
		wrapperRef,
		templateInsertUpdatesSelection,
		__experimentalCaptureToolbars: captureToolbars,
		__experimentalAppenderTagName,
		renderAppender,
		orientation,
		placeholder,
		layout,
		name,
		blockType,
		parentLock,
		defaultLayout,
	} = props;

	useNestedSettingsUpdate(
		clientId,
		parentLock,
		allowedBlocks,
		prioritizedInserterBlocks,
		defaultBlock,
		directInsert,
		__experimentalDefaultBlock,
		__experimentalDirectInsert,
		templateLock,
		captureToolbars,
		orientation,
		layout
	);

	useInnerBlockTemplateSync(
		clientId,
		template,
		templateLock,
		templateInsertUpdatesSelection
	);

	const defaultLayoutBlockSupport =
		getBlockSupport( name, 'layout' ) ||
		getBlockSupport( name, '__experimentalLayout' ) ||
		EMPTY_OBJECT;

	const { allowSizingOnChildren = false } = defaultLayoutBlockSupport;
	const usedLayout = layout || defaultLayoutBlockSupport;

	const memoedLayout = useMemo(
		() => ( {
			// Default layout will know about any content/wide size defined by the theme.
			...defaultLayout,
			...usedLayout,
			...( allowSizingOnChildren && {
				allowSizingOnChildren: true,
			} ),
		} ),
		[ defaultLayout, usedLayout, allowSizingOnChildren ]
	);

	// For controlled inner blocks, we don't want a change in blocks to
	// re-render the blocks list.
	const items = (
		<BlockListItemsMemo
			rootClientId={ clientId }
			renderAppender={ renderAppender }
			__experimentalAppenderTagName={ __experimentalAppenderTagName }
			layout={ memoedLayout }
			wrapperRef={ wrapperRef }
			placeholder={ placeholder }
		/>
	);

	if (
		! blockType?.providesContext ||
		Object.keys( blockType.providesContext ).length === 0
	) {
		return items;
	}

	return <BlockContext clientId={ clientId }>{ items }</BlockContext>;
}

/**
 * The controlled inner blocks component wraps the uncontrolled inner blocks
 * component with the blockSync hook. This keeps the innerBlocks of the block in
 * the block-editor store in sync with the blocks of the controlling entity. An
 * example of an inner block controller is a template part block, which provides
 * its own blocks from the template part entity data source.
 *
 * @param {Object} props The component props.
 */
function ControlledInnerBlocks( props ) {
	useBlockSync( props );
	return <UncontrolledInnerBlocks { ...props } />;
}

const ForwardedInnerBlocks = forwardRef( ( props, ref ) => {
	const innerBlocksProps = useInnerBlocksProps( { ref }, props );
	return (
		<div className="block-editor-inner-blocks">
			<div { ...innerBlocksProps } />
		</div>
	);
} );

/**
 * This hook is used to lightly mark an element as an inner blocks wrapper
 * element. Call this hook and pass the returned props to the element to mark as
 * an inner blocks wrapper, automatically rendering inner blocks as children. If
 * you define a ref for the element, it is important to pass the ref to this
 * hook, which the hook in turn will pass to the component through the props it
 * returns. Optionally, you can also pass any other props through this hook, and
 * they will be merged and returned.
 *
 * @param {Object} props   Optional. Props to pass to the element. Must contain
 *                         the ref if one is defined.
 * @param {Object} options Optional. Inner blocks options.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inner-blocks/README.md
 */
export function useInnerBlocksProps( props = {}, options = {} ) {
	const {
		__unstableDisableLayoutClassNames,
		__unstableDisableDropZone,
		dropZoneElement,
	} = options;
	const {
		clientId,
		layout = null,
		__unstableLayoutClassNames: layoutClassNames = '',
	} = useBlockEditContext();
	const selected = useSelect(
		( select ) => {
			const {
				getBlockName,
				isZoomOut,
				getTemplateLock,
				getBlockRootClientId,
				getBlockEditingMode,
				getBlockSettings,
				getSectionRootClientId,
			} = unlock( select( blockEditorStore ) );

			if ( ! clientId ) {
				const sectionRootClientId = getSectionRootClientId();
				// Disable the root drop zone when zoomed out and the section root client id
				// is not the root block list (represented by an empty string).
				// This avoids drag handling bugs caused by having two block lists acting as
				// drop zones - the actual 'root' block list and the section root.
				return {
					isDropZoneDisabled:
						isZoomOut() && sectionRootClientId !== '',
				};
			}

			const { hasBlockSupport, getBlockType } = select( blocksStore );
			const blockName = getBlockName( clientId );
			const blockEditingMode = getBlockEditingMode( clientId );
			const parentClientId = getBlockRootClientId( clientId );
			const [ defaultLayout ] = getBlockSettings( clientId, 'layout' );

			let _isDropZoneDisabled = blockEditingMode === 'disabled';

			if ( isZoomOut() ) {
				// In zoom out mode, we want to disable the drop zone for the sections.
				// The inner blocks belonging to the section drop zone is
				// already disabled by the blocks themselves being disabled.
				const sectionRootClientId = getSectionRootClientId();
				_isDropZoneDisabled = clientId !== sectionRootClientId;
			}

			return {
				__experimentalCaptureToolbars: hasBlockSupport(
					blockName,
					'__experimentalExposeControlsToChildren',
					false
				),
				name: blockName,
				blockType: getBlockType( blockName ),
				parentLock: getTemplateLock( parentClientId ),
				parentClientId,
				isDropZoneDisabled: _isDropZoneDisabled,
				defaultLayout,
			};
		},
		[ clientId ]
	);
	const {
		__experimentalCaptureToolbars,
		name,
		blockType,
		parentLock,
		parentClientId,
		isDropZoneDisabled,
		defaultLayout,
	} = selected;

	const blockDropZoneRef = useBlockDropZone( {
		dropZoneElement,
		rootClientId: clientId,
		parentClientId,
	} );

	const ref = useMergeRefs( [
		props.ref,
		__unstableDisableDropZone ||
		isDropZoneDisabled ||
		( layout?.isManualPlacement &&
			window.__experimentalEnableGridInteractivity )
			? null
			: blockDropZoneRef,
	] );

	const innerBlocksProps = {
		__experimentalCaptureToolbars,
		layout,
		name,
		blockType,
		parentLock,
		defaultLayout,
		...options,
	};
	const InnerBlocks =
		innerBlocksProps.value && innerBlocksProps.onChange
			? ControlledInnerBlocks
			: UncontrolledInnerBlocks;

	return {
		...props,
		ref,
		className: clsx(
			props.className,
			'block-editor-block-list__layout',
			__unstableDisableLayoutClassNames ? '' : layoutClassNames
		),
		children: clientId ? (
			<InnerBlocks { ...innerBlocksProps } clientId={ clientId } />
		) : (
			<BlockListItems { ...options } />
		),
	};
}

useInnerBlocksProps.save = getInnerBlocksProps;

// Expose default appender placeholders as components.
ForwardedInnerBlocks.DefaultBlockAppender = DefaultBlockAppender;
ForwardedInnerBlocks.ButtonBlockAppender = ButtonBlockAppender;

ForwardedInnerBlocks.Content = () => useInnerBlocksProps.save().children;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inner-blocks/README.md
 */
export default ForwardedInnerBlocks;
