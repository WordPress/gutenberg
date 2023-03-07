/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AsyncModeProvider,
	useSelect,
	useDispatch,
	useRegistry,
} from '@wordpress/data';
import {
	useViewportMatch,
	useMergeRefs,
	useDebounce,
} from '@wordpress/compose';
import {
	createContext,
	useMemo,
	useCallback,
	useLayoutEffect,
	useContext,
	useRef,
	useReducer,
	useId,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import { useInBetweenInserter } from './use-in-between-inserter';
import { store as blockEditorStore } from '../../store';
import { usePreParsePatterns } from '../../utils/pre-parse-patterns';
import { LayoutProvider, defaultLayout } from './layout';
import BlockToolsBackCompat from '../block-tools/back-compat';
import { useBlockSelectionClearer } from '../block-selection-clearer';
import { useInnerBlocksProps } from '../inner-blocks';
import {
	BlockEditContextProvider,
	DEFAULT_BLOCK_EDIT_CONTEXT,
} from '../block-edit/context';

const componentsContext = createContext( { render() {}, unmount() {} } );

export const IntersectionObserver = createContext();
const pendingBlockVisibilityUpdatesPerRegistry = new WeakMap();

function useRootPortal( component ) {
	const components = useContext( componentsContext );
	const id = useId();

	// Run every time the component rerenders.
	useLayoutEffect( () => {
		if ( component ) {
			components.render( id, component );
		} else {
			components.unmount( id );
		}
	}, [ components, id, component ] );

	// Run only on unmount.
	useLayoutEffect( () => () => components.unmount( id ), [ components, id ] );
}

function Component( { id, componentsById, renderById } ) {
	const [ , forceRender ] = useReducer( () => ( {} ) );
	useLayoutEffect( () => {
		renderById.current.set( id, forceRender );
	}, [ id, renderById ] );
	return componentsById.current.get( id );
}

function Components( { componentsById, renderById, renderAll } ) {
	const [ , forceRender ] = useReducer( () => ( {} ) );

	useLayoutEffect( () => {
		renderAll.current = forceRender;
	}, [ renderAll ] );

	return Array.from( componentsById.current.keys() ).map( ( key ) => (
		<Component
			key={ key }
			id={ key }
			componentsById={ componentsById }
			renderById={ renderById }
		/>
	) );
}

function ComponentRenderer( { children } ) {
	const componentsById = useRef( new Map() );
	const renderById = useRef( new Map() );
	const renderAll = useRef( () => {} );
	return (
		<componentsContext.Provider
			value={ useMemo(
				() => ( {
					render( id, component ) {
						if ( componentsById.current.has( id ) ) {
							componentsById.current.set( id, component );
							renderById.current.get( id )();
						} else {
							componentsById.current.set( id, component );
							renderAll.current();
						}
					},
					unmount( id ) {
						if ( componentsById.current.has( id ) ) {
							componentsById.current.delete( id );
							renderById.current.delete( id );
							renderAll.current();
						}
					},
				} ),
				[]
			) }
		>
			<Components
				componentsById={ componentsById }
				renderById={ renderById }
				renderAll={ renderAll }
			/>
			{ children }
		</componentsContext.Provider>
	);
}

function Root( { className, ...settings } ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const { isOutlineMode, isFocusMode, editorMode } = useSelect(
		( select ) => {
			const { getSettings, __unstableGetEditorMode } =
				select( blockEditorStore );
			const { outlineMode, focusMode } = getSettings();
			return {
				isOutlineMode: outlineMode,
				isFocusMode: focusMode,
				editorMode: __unstableGetEditorMode(),
			};
		},
		[]
	);
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
		{
			trailing: true,
		}
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
			className: classnames( 'is-root-container', className, {
				'is-outline-mode': isOutlineMode,
				'is-focus-mode': isFocusMode && isLargeViewport,
				'is-navigate-mode': editorMode === 'navigation',
			} ),
		},
		settings
	);
	return (
		<IntersectionObserver.Provider value={ intersectionObserver }>
			<div { ...innerBlocksProps }>
				<ComponentRenderer>
					{ innerBlocksProps.children }
				</ComponentRenderer>
			</div>
		</IntersectionObserver.Provider>
	);
}

export default function BlockList( settings ) {
	usePreParsePatterns();
	return (
		<BlockToolsBackCompat>
			<BlockEditContextProvider value={ DEFAULT_BLOCK_EDIT_CONTEXT }>
				<Root { ...settings } />
			</BlockEditContextProvider>
		</BlockToolsBackCompat>
	);
}

BlockList.useRootPortal = useRootPortal;

function Items( {
	placeholder,
	rootClientId,
	renderAppender,
	__experimentalAppenderTagName,
	__experimentalLayout: layout = defaultLayout,
} ) {
	const { order, selectedBlocks, visibleBlocks } = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getSelectedBlockClientIds,
				__unstableGetVisibleBlocks,
			} = select( blockEditorStore );
			return {
				order: getBlockOrder( rootClientId ),
				selectedBlocks: getSelectedBlockClientIds(),
				visibleBlocks: __unstableGetVisibleBlocks(),
			};
		},
		[ rootClientId ]
	);

	return (
		<LayoutProvider value={ layout }>
			{ order.map( ( clientId ) => (
				<AsyncModeProvider
					key={ clientId }
					value={
						// Only provide data asynchronously if the block is
						// not visible and not selected.
						! visibleBlocks.has( clientId ) &&
						! selectedBlocks.includes( clientId )
					}
				>
					<BlockListBlock
						rootClientId={ rootClientId }
						clientId={ clientId }
					/>
				</AsyncModeProvider>
			) ) }
			{ order.length < 1 && placeholder }
			<BlockListAppender
				tagName={ __experimentalAppenderTagName }
				rootClientId={ rootClientId }
				renderAppender={ renderAppender }
			/>
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
