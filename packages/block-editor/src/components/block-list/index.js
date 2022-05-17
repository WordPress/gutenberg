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
import { useViewportMatch, useMergeRefs } from '@wordpress/compose';
import { createContext, useState, useMemo } from '@wordpress/element';

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

const elementContext = createContext();

export const IntersectionObserver = createContext();

function Root( { className, ...settings } ) {
	const [ element, setElement ] = useState();
	const isLargeViewport = useViewportMatch( 'medium' );
	const { isOutlineMode, isFocusMode, isNavigationMode } = useSelect(
		( select ) => {
			const { getSettings, isNavigationMode: _isNavigationMode } = select(
				blockEditorStore
			);
			const { outlineMode, focusMode } = getSettings();
			return {
				isOutlineMode: outlineMode,
				isFocusMode: focusMode,
				isNavigationMode: _isNavigationMode(),
			};
		},
		[]
	);
	const registry = useRegistry();
	const { setBlockVisibility } = useDispatch( blockEditorStore );
	const intersectionObserver = useMemo( () => {
		const { IntersectionObserver: Observer } = window;

		if ( ! Observer ) {
			return;
		}

		return new Observer( ( entries ) => {
			registry.batch( () => {
				for ( const entry of entries ) {
					const clientId = entry.target.getAttribute( 'data-block' );
					setBlockVisibility( clientId, entry.isIntersecting );
				}
			} );
		} );
	}, [] );
	const innerBlocksProps = useInnerBlocksProps(
		{
			ref: useMergeRefs( [
				useBlockSelectionClearer(),
				useInBetweenInserter(),
				setElement,
			] ),
			className: classnames( 'is-root-container', className, {
				'is-outline-mode': isOutlineMode,
				'is-focus-mode': isFocusMode && isLargeViewport,
				'is-navigate-mode': isNavigationMode,
			} ),
		},
		settings
	);
	return (
		<elementContext.Provider value={ element }>
			<IntersectionObserver.Provider value={ intersectionObserver }>
				<div { ...innerBlocksProps } />
			</IntersectionObserver.Provider>
		</elementContext.Provider>
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

BlockList.__unstableElementContext = elementContext;

function Item( { rootClientId, isSelected, clientId } ) {
	const isVisible = useSelect(
		( select ) => {
			return select( blockEditorStore ).isBlockVisible( clientId );
		},
		[ clientId ]
	);

	return (
		<AsyncModeProvider
			value={
				// Only provide data asynchronously if the block is
				// not visible and not selected.
				! isVisible && ! isSelected
			}
		>
			<BlockListBlock
				rootClientId={ rootClientId }
				clientId={ clientId }
			/>
		</AsyncModeProvider>
	);
}

function Items( {
	placeholder,
	rootClientId,
	renderAppender,
	__experimentalAppenderTagName,
	__experimentalLayout: layout = defaultLayout,
} ) {
	const { order, selectedBlocks } = useSelect(
		( select ) => {
			const { getBlockOrder, getSelectedBlockClientIds } = select(
				blockEditorStore
			);
			return {
				order: getBlockOrder( rootClientId ),
				selectedBlocks: getSelectedBlockClientIds(),
			};
		},
		[ rootClientId ]
	);

	return (
		<LayoutProvider value={ layout }>
			{ order.map( ( clientId ) => (
				<Item
					key={ clientId }
					clientId={ clientId }
					isSelected={ selectedBlocks.includes( clientId ) }
					rootClientId={ rootClientId }
				/>
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
