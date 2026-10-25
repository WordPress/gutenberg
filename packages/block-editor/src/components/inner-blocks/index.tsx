import type {
	ForwardRefExoticComponent,
	ReactNode,
	RefAttributes,
} from 'react';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useMemo, memo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	getBlockSupport,
	store as blocksStore,
	__unstableGetInnerBlocksProps as getInnerBlocksProps,
} from '@wordpress/blocks';
import ButtonBlockAppender from './button-block-appender';
import DefaultBlockAppender from './default-block-appender';
import useNestedSettingsUpdate from './use-nested-settings-update';
import useInnerBlockTemplateSync from './use-inner-block-template-sync';
import useBlockContext from './use-block-context';
import { BlockListItems } from '../block-list';
import { BlockContextProvider } from '../block-context';
import { useBlockEditContext } from '../block-edit/context';
import useBlockSync from '../provider/use-block-sync';
import {
	BoundInnerBlocksAncestorsProvider,
	isInnerBlocksBindingEnabled,
	useBoundInnerBlocks,
	useInnerBlocksBinding,
} from './use-bound-inner-blocks';
import type { InnerBlocksBinding } from './use-bound-inner-blocks';
import { store as blockEditorStore } from '../../store';
import useBlockDropZone from '../use-block-drop-zone';
import { normalizeLegacyLayout } from '../../layouts/utils';
import { unlock } from '../../lock-unlock';
import type { Layout } from '../../layouts/types';
import type { BoundInnerBlocks as BoundInnerBlocksBinding } from '../../store/types';
import type {
	InnerBlocksOptions,
	InnerBlocksProps,
	UseInnerBlocksPropsProps,
	UseInnerBlocksPropsResult,
} from './types';

const EMPTY_OBJECT: Layout & {
	allowSizingOnChildren?: boolean;
	default?: Layout;
} = {};

function BlockContext( {
	children,
	clientId,
}: {
	children: ReactNode;
	clientId: string;
} ) {
	const context = useBlockContext( clientId );
	return (
		// Rendered for blocks that provide context, which have one.
		<BlockContextProvider value={ context as Record< string, unknown > }>
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
 * @param props The component props.
 */
function UncontrolledInnerBlocks( props: InnerBlocksProps ) {
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

	// The layout support is a config object.
	const defaultLayoutBlockSupport = ( getBlockSupport(
		// A block with inner blocks has a name.
		name as string,
		'layout'
	) ||
		getBlockSupport( name as string, '__experimentalLayout' ) ||
		EMPTY_OBJECT ) as typeof EMPTY_OBJECT;

	const { allowSizingOnChildren = false } = defaultLayoutBlockSupport;
	// Legacy markup expresses a constrained layout as `inherit: true` or bare
	// content/wide sizes with no `type`. Promote it the way the layout styling
	// hooks do, so the inner blocks resolve to constrained rather than flow.
	const normalizedLayout = useMemo(
		() => normalizeLegacyLayout( layout ),
		[ layout ]
	);
	// The support is a config object, e.g. `{ allowSwitching: false, default: { type: 'flex' } }`,
	// so the layout itself lives under `default`. Passing the config through would leave the
	// context without a `type`, and consumers would resolve it to the flow layout.
	const usedLayout =
		normalizedLayout || defaultLayoutBlockSupport.default || EMPTY_OBJECT;

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
			// @ts-expect-error The block list ignores `wrapperRef`.
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
 * @param props The component props.
 */
function ControlledInnerBlocks( props: InnerBlocksProps ) {
	useBlockSync( props );
	return <UncontrolledInnerBlocks { ...props } />;
}

/**
 * Inner blocks that are bound to a source, which supplies them through the
 * block's `metadata.bindings.innerBlocks`: they're controlled inner blocks,
 * synced with the source, while the block keeps its own inner blocks as the
 * fallback that its parents see.
 *
 * @param props                  The component props.
 * @param props.boundInnerBlocks The binding.
 */
function ControlledBoundInnerBlocks( {
	boundInnerBlocks,
	...props
}: InnerBlocksProps & { boundInnerBlocks: BoundInnerBlocksBinding } ) {
	useBlockSync( { ...props, boundInnerBlocks } );
	return <UncontrolledInnerBlocks { ...props } />;
}

/**
 * Resolves the inner blocks bound to a source, unless they would be nested in
 * themselves, in which case the block keeps its own inner blocks.
 *
 * @param props                    The component props.
 * @param props.innerBlocksBinding The binding, its source and context.
 */
function BoundInnerBlocks( {
	innerBlocksBinding,
	...props
}: InnerBlocksProps & { innerBlocksBinding: InnerBlocksBinding } ) {
	const boundInnerBlocks = useBoundInnerBlocks(
		props.clientId,
		innerBlocksBinding
	);
	if ( ! boundInnerBlocks ) {
		return <UncontrolledInnerBlocks { ...props } />;
	}
	const {
		ancestorKeys,
		boundInnerBlocks: binding,
		...syncProps
	} = boundInnerBlocks;
	return (
		<BoundInnerBlocksAncestorsProvider value={ ancestorKeys }>
			<ControlledBoundInnerBlocks
				{ ...props }
				{ ...syncProps }
				// Inner blocks that the source doesn't let the user edit
				// can't be added, moved, or removed either.
				templateLock={ binding.editable ? props.templateLock : 'all' }
				boundInnerBlocks={ binding }
			/>
		</BoundInnerBlocksAncestorsProvider>
	);
}

/**
 * Inner blocks that may be bound to a source, when the block supports it.
 *
 * @param props The component props.
 */
function MaybeBoundInnerBlocks( props: InnerBlocksProps ) {
	const innerBlocksBinding = useInnerBlocksBinding(
		props.clientId,
		props.name
	);
	if ( ! innerBlocksBinding ) {
		return <UncontrolledInnerBlocks { ...props } />;
	}
	return (
		<BoundInnerBlocks
			{ ...props }
			innerBlocksBinding={ innerBlocksBinding }
		/>
	);
}

// The statics are assigned below.
const ForwardedInnerBlocks = forwardRef< HTMLElement, InnerBlocksOptions >(
	( props, ref ) => {
		const innerBlocksProps = useInnerBlocksProps( { ref }, props );
		return (
			<div className="block-editor-inner-blocks">
				<div { ...innerBlocksProps } />
			</div>
		);
	}
) as ForwardRefExoticComponent<
	InnerBlocksOptions & RefAttributes< HTMLElement >
> & {
	DefaultBlockAppender: typeof DefaultBlockAppender;
	ButtonBlockAppender: typeof ButtonBlockAppender;
	Content: () => ReactNode;
};

/**
 * This hook is used to lightly mark an element as an inner blocks wrapper
 * element. Call this hook and pass the returned props to the element to mark as
 * an inner blocks wrapper, automatically rendering inner blocks as children. If
 * you define a ref for the element, it is important to pass the ref to this
 * hook, which the hook in turn will pass to the component through the props it
 * returns. Optionally, you can also pass any other props through this hook, and
 * they will be merged and returned.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inner-blocks/README.md
 *
 * @param {Object} props   Optional. Props to pass to the element. Must contain
 *                         the ref if one is defined.
 * @param {Object} options Optional. Inner blocks options.
 */
export function useInnerBlocksProps<
	P extends UseInnerBlocksPropsProps = UseInnerBlocksPropsProps,
>(
	// Generic, so inline props of any element are not excess properties.
	props: P | Record< string, never > = {},
	options: InnerBlocksOptions = {}
): UseInnerBlocksPropsResult {
	const {
		__unstableDisableLayoutClassNames,
		__unstableDisableDropZone,
		dropZoneElement,
		layout: layoutOverride,
	} = options;
	const {
		clientId,
		layout: contextLayout = null,
		__unstableLayoutClassNames: layoutClassNames = '',
	} = useBlockEditContext();
	// An options layout takes precedence over the context layout, as it does
	// for the inner blocks settings, so containers whose layout attribute
	// doesn't apply to their inner blocks (e.g. Post Template) can opt out.
	// The context holds the layout of the block.
	const layout = layoutOverride ?? ( contextLayout as Layout | null );
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
	let InnerBlocks = UncontrolledInnerBlocks;
	if ( innerBlocksProps.value && innerBlocksProps.onChange ) {
		InnerBlocks = ControlledInnerBlocks;
	} else if ( isInnerBlocksBindingEnabled() ) {
		InnerBlocks = MaybeBoundInnerBlocks;
	}

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

// The saved props hold the inner blocks elements.
ForwardedInnerBlocks.Content = () =>
	useInnerBlocksProps.save().children as ReactNode;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inner-blocks/README.md
 */
export default ForwardedInnerBlocks;
