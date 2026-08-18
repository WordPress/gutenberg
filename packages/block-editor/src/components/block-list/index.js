import clsx from 'clsx';
import {
	AsyncModeProvider,
	useSelect,
	useDispatch,
	useRegistry,
} from '@wordpress/data';
import { useMergeRefs, useDebounce } from '@wordpress/compose';
import {
	createContext,
	useEffect,
	useMemo,
	useCallback,
} from '@wordpress/element';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import { useInBetweenInserter } from './use-in-between-inserter';
import { store as blockEditorStore } from '../../store';
import { LayoutProvider, defaultLayout } from './layout';
import { useBlockSelectionClearer } from '../block-selection-clearer';
import { useInnerBlocksProps } from '../inner-blocks';
import {
	BlockEditContextProvider,
	DEFAULT_BLOCK_EDIT_CONTEXT,
} from '../block-edit/context';
import { ZoomOutSeparator } from './zoom-out-separator';
import { unlock } from '../../lock-unlock';

export const IntersectionObserver = createContext();
IntersectionObserver.displayName = 'IntersectionObserverContext';

const pendingBlockVisibilityUpdatesPerRegistry = new WeakMap();
const delayedBlockVisibilityDebounceOptions = {
	trailing: true,
};

function Root( { className, ...settings } ) {
	const {
		isOutlineMode,
		isFocusMode,
		isPreviewMode,
		editedContentOnlySection,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			isTyping,
			hasBlockSpotlight,
			getEditedContentOnlySection,
		} = unlock( select( blockEditorStore ) );
		const {
			outlineMode,
			focusMode,
			isPreviewMode: _isPreviewMode,
		} = getSettings();
		return {
			isOutlineMode: outlineMode && ! isTyping(),
			/*
			 * Spotlight fades everything but the block being worked on, which
			 * has nothing to offer a canvas that cannot be edited — a preview
			 * would just render most of its content faded out.
			 */
			isFocusMode:
				! _isPreviewMode && ( focusMode || hasBlockSpotlight() ),
			isPreviewMode: _isPreviewMode,
			editedContentOnlySection: getEditedContentOnlySection(),
		};
	}, [] );
	const registry = useRegistry();
	const { setBlockVisibility } = useDispatch( blockEditorStore );

	const delayedBlockVisibilityUpdates = useDebounce(
		useCallback( () => {
			const updates = {};
			pendingBlockVisibilityUpdatesPerRegistry
				.get( registry )
				.forEach( ( [ id, isIntersecting ] ) => {
					updates[ id ] = isIntersecting;
				} );
			setBlockVisibility( updates );
		}, [ registry ] ),
		300,
		delayedBlockVisibilityDebounceOptions
	);
	const intersectionObserver = useMemo( () => {
		const { IntersectionObserver: Observer } = window;

		if ( ! Observer ) {
			return;
		}

		return new Observer( ( entries ) => {
			if ( ! pendingBlockVisibilityUpdatesPerRegistry.get( registry ) ) {
				pendingBlockVisibilityUpdatesPerRegistry.set( registry, [] );
			}
			for ( const entry of entries ) {
				const clientId = entry.target.getAttribute( 'data-block' );
				pendingBlockVisibilityUpdatesPerRegistry
					.get( registry )
					.push( [ clientId, entry.isIntersecting ] );
			}
			delayedBlockVisibilityUpdates();
		} );
	}, [] );
	const innerBlocksProps = useInnerBlocksProps(
		{
			ref: useMergeRefs( [
				useBlockSelectionClearer(),
				useInBetweenInserter(),
			] ),
			className: clsx( 'is-root-container', className, {
				'is-outline-mode': isOutlineMode,
				'is-focus-mode': isFocusMode,
				'is-preview-mode': isPreviewMode,
			} ),
		},
		settings
	);
	return (
		<IntersectionObserver.Provider value={ intersectionObserver }>
			<div { ...innerBlocksProps } />
			{ !! editedContentOnlySection && (
				<StopEditingContentOnlySectionOnOutsideSelect
					clientId={ editedContentOnlySection }
				/>
			) }
		</IntersectionObserver.Provider>
	);
}

function StopEditingContentOnlySectionOnOutsideSelect( { clientId } ) {
	const { stopEditingContentOnlySection } = unlock(
		useDispatch( blockEditorStore )
	);
	const isBlockOrDescendantSelected = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				hasSelectedInnerBlock,
				getBlockSelectionStart,
			} = select( blockEditorStore );
			return (
				! getBlockSelectionStart() ||
				isBlockSelected( clientId ) ||
				hasSelectedInnerBlock( clientId, true )
			);
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! isBlockOrDescendantSelected ) {
			stopEditingContentOnlySection();
		}
	}, [ isBlockOrDescendantSelected, stopEditingContentOnlySection ] );

	return null;
}

export default function BlockList( settings ) {
	return (
		<BlockEditContextProvider value={ DEFAULT_BLOCK_EDIT_CONTEXT }>
			<Root { ...settings } />
		</BlockEditContextProvider>
	);
}

const EMPTY_ARRAY = [];
const EMPTY_SET = new Set();

function Items( {
	placeholder,
	rootClientId,
	renderAppender: CustomAppender,
	__experimentalAppenderTagName,
	layout = defaultLayout,
} ) {
	// Avoid passing CustomAppender to useSelect because it could be a new
	// function on every render.
	const hasAppender = CustomAppender !== false;
	const hasCustomAppender = !! CustomAppender;
	const {
		order,
		isZoomOut,
		selectedBlocks,
		visibleBlocks,
		ghostBlockName,
		ghostBlockAttributes,
		shouldRenderAppender,
	} = useSelect(
		( select ) => {
			const {
				getSettings,
				getBlockOrder,
				getSelectedBlockClientIds,
				__unstableGetVisibleBlocks,
				getTemplateLock,
				getBlockEditingMode,
				isSectionBlock,
				isContainerInsertableToInContentOnlyMode,
				getBlockName,
				getBlockListSettings,
				isZoomOut: _isZoomOut,
				canInsertBlockType,
			} = unlock( select( blockEditorStore ) );

			const _order = getBlockOrder( rootClientId );

			if ( getSettings().isPreviewMode ) {
				return {
					order: _order,
					selectedBlocks: EMPTY_ARRAY,
					visibleBlocks: EMPTY_SET,
				};
			}

			// A block list without a custom appender renders a ghost of
			// the container's default block while empty: a real block
			// object rendered before it exists in the store, inserted on
			// entry.
			let _ghostBlockName;
			let _ghostBlockAttributes;
			if ( hasAppender && ! hasCustomAppender && ! _order.length ) {
				const defaultBlock = ( rootClientId
					? getBlockListSettings( rootClientId )?.defaultBlock
					: undefined ) ?? { name: getDefaultBlockName() };
				if (
					defaultBlock.name &&
					canInsertBlockType( defaultBlock.name, rootClientId )
				) {
					_ghostBlockName = defaultBlock.name;
					_ghostBlockAttributes = defaultBlock.attributes;
				}
			}

			const selectedBlockClientIds = getSelectedBlockClientIds();
			const selectedBlockClientId = selectedBlockClientIds[ 0 ];
			const showRootAppender =
				! rootClientId &&
				! selectedBlockClientId &&
				( ! _order.length ||
					! canInsertBlockType(
						getDefaultBlockName(),
						rootClientId
					) );
			const hasSelectedRoot = !! (
				rootClientId &&
				selectedBlockClientId &&
				rootClientId === selectedBlockClientId
			);

			const templateLock = getTemplateLock( rootClientId );

			const appenderAllowed =
				( ! isSectionBlock( rootClientId ) ||
					isContainerInsertableToInContentOnlyMode(
						getBlockName( selectedBlockClientId ),
						rootClientId
					) ) &&
				getBlockEditingMode( rootClientId ) !== 'disabled' &&
				( ! templateLock || templateLock === 'contentOnly' ) &&
				hasAppender &&
				! _isZoomOut();

			return {
				order: _order,
				selectedBlocks: selectedBlockClientIds,
				visibleBlocks: __unstableGetVisibleBlocks(),
				isZoomOut: _isZoomOut(),
				// The ghost is the block list's empty state: it renders
				// whether or not the block is selected.
				ghostBlockName: appenderAllowed ? _ghostBlockName : undefined,
				ghostBlockAttributes: _ghostBlockAttributes,
				shouldRenderAppender:
					appenderAllowed &&
					( hasCustomAppender ||
						hasSelectedRoot ||
						showRootAppender ),
			};
		},
		[ rootClientId, hasAppender, hasCustomAppender ]
	);

	// One ghost per empty period: regenerated when the list empties again
	// or the default block changes, stable in between so the client ID,
	// and with it the DOM, survives materialization.
	const ghostBlock = useMemo(
		() =>
			ghostBlockName
				? createBlock( ghostBlockName, ghostBlockAttributes )
				: null,
		[ ghostBlockName, ghostBlockAttributes ]
	);
	const showGhost = !! ghostBlock;

	const items = showGhost ? [ ...order, ghostBlock.clientId ] : order;

	return (
		<LayoutProvider value={ layout }>
			{ items.map( ( clientId ) => (
				<AsyncModeProvider
					key={ clientId }
					value={
						// Only provide data asynchronously if the block is
						// not visible, not selected, and not the ghost.
						clientId !== ghostBlock?.clientId &&
						! visibleBlocks.has( clientId ) &&
						! selectedBlocks.includes( clientId )
					}
				>
					{ isZoomOut && (
						<ZoomOutSeparator
							clientId={ clientId }
							rootClientId={ rootClientId }
							position="top"
						/>
					) }
					<BlockListBlock
						rootClientId={ rootClientId }
						clientId={ clientId }
						ghostBlock={
							clientId === ghostBlock?.clientId
								? ghostBlock
								: undefined
						}
					/>
					{ isZoomOut && (
						<ZoomOutSeparator
							clientId={ clientId }
							rootClientId={ rootClientId }
							position="bottom"
						/>
					) }
				</AsyncModeProvider>
			) ) }
			{ order.length < 1 && placeholder }
			{ shouldRenderAppender && ! showGhost && (
				<BlockListAppender
					tagName={ __experimentalAppenderTagName }
					rootClientId={ rootClientId }
					CustomAppender={ CustomAppender }
				/>
			) }
		</LayoutProvider>
	);
}

export function BlockListItems( props ) {
	// This component needs to always be synchronous as it's the one changing
	// the async mode depending on the block selection.
	return (
		<AsyncModeProvider value={ false }>
			<Items { ...props } />
		</AsyncModeProvider>
	);
}
