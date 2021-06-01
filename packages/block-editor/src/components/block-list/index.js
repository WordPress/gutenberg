/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import { useViewportMatch, useMergeRefs } from '@wordpress/compose';
import { createContext, useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import useBlockDropZone from '../use-block-drop-zone';
import { useInBetweenInserter } from './use-in-between-inserter';
import { store as blockEditorStore } from '../../store';
import { usePreParsePatterns } from '../../utils/pre-parse-patterns';
import { LayoutProvider, defaultLayout } from './layout';
import BlockToolsBackCompat from '../block-tools/back-compat';
import { useBlockSelectionClearer } from '../block-selection-clearer';

export const IntersectionObserver = createContext();

function Root( { className, children } ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const {
		isTyping,
		isOutlineMode,
		isFocusMode,
		isNavigationMode,
	} = useSelect( ( select ) => {
		const {
			isTyping: _isTyping,
			getSettings,
			isNavigationMode: _isNavigationMode,
		} = select( blockEditorStore );
		const { outlineMode, focusMode } = getSettings();
		return {
			isTyping: _isTyping(),
			isOutlineMode: outlineMode,
			isFocusMode: focusMode,
			isNavigationMode: _isNavigationMode(),
		};
	}, [] );
	return (
		<div
			ref={ useMergeRefs( [
				useBlockSelectionClearer(),
				useBlockDropZone(),
				useInBetweenInserter(),
			] ) }
			className={ classnames(
				'block-editor-block-list__layout is-root-container',
				className,
				{
					'is-typing': isTyping,
					'is-outline-mode': isOutlineMode,
					'is-focus-mode': isFocusMode && isLargeViewport,
					'is-navigate-mode': isNavigationMode,
				}
			) }
		>
			{ children }
		</div>
	);
}

export default function BlockList( { className, __experimentalLayout } ) {
	usePreParsePatterns();
	return (
		<BlockToolsBackCompat>
			<Root className={ className }>
				<BlockListItems __experimentalLayout={ __experimentalLayout } />
			</Root>
		</BlockToolsBackCompat>
	);
}

function Items( {
	placeholder,
	rootClientId,
	renderAppender,
	__experimentalAppenderTagName,
	__experimentalLayout: layout = defaultLayout,
} ) {
	const [ intersectingBlocks, setIntersectingBlocks ] = useState( new Set() );
	const intersectionObserver = useMemo( () => {
		const { IntersectionObserver: Observer } = window;

		if ( ! Observer ) {
			return;
		}

		return new Observer( ( entries ) => {
			setIntersectingBlocks( ( oldIntersectingBlocks ) => {
				const newIntersectingBlocks = new Set( oldIntersectingBlocks );
				for ( const entry of entries ) {
					const clientId = entry.target.getAttribute( 'data-block' );
					const action = entry.isIntersecting ? 'add' : 'delete';
					newIntersectingBlocks[ action ]( clientId );
				}
				return newIntersectingBlocks;
			} );
		} );
	}, [ setIntersectingBlocks ] );
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
			<IntersectionObserver.Provider value={ intersectionObserver }>
				{ order.map( ( clientId ) => (
					<AsyncModeProvider
						key={ clientId }
						value={
							// Only provide data asynchronously if the block is
							// not visible and not selected.
							! intersectingBlocks.has( clientId ) &&
							! selectedBlocks.includes( clientId )
						}
					>
						<BlockListBlock
							rootClientId={ rootClientId }
							clientId={ clientId }
						/>
					</AsyncModeProvider>
				) ) }
			</IntersectionObserver.Provider>
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
