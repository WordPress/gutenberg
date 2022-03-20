/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import { useViewportMatch, useMergeRefs } from '@wordpress/compose';
import {
	createContext,
	useState,
	useMemo,
	cloneElement,
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
			<div { ...innerBlocksProps } />
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

function Items( {
	placeholder,
	rootClientId,
	renderAppender,
	__experimentalAppenderTagName,
	__experimentalBlocksListItemsWrapper,
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

	let blocks = order.map( ( clientId ) => {
		return (
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
		);
	} );

	/**
	 * This is an attempt to use inner blocks as BentoBaseCarousel slides.
	 *
	 * The problem: BentoBaseCarousel expects its immediate children to be
	 * the slides:
	 *
	 * https://github.com/ampproject/amphtml/blob/5d52f0fcd377dd9049e8be5c58bcb6a5b0b51646/src/bento/components/bento-base-carousel/1.0/component.js#L104-L108
	 *
	 * However, we cannot easily pass a list of components representing Gutenberg inner blocks.
	 * We can only render a <div {...innerBlocksProps} /> which then embers a number of intermediate layers
	 * between that root component and the actual list of specific child block components. There are
	 * ContextProviders, layouts, and more.
	 *
	 * The workaround: support wrapping the list of inner blocks in a custom wrapper.
	 *
	 * Potential problems: Bento components may have event handlers or portals that are incompatible with
	 * Gutenberg event handlers or portals.
	 */
	if ( __experimentalBlocksListItemsWrapper ) {
		blocks = cloneElement( __experimentalBlocksListItemsWrapper, {
			children: blocks,
		} );
	}

	return (
		<LayoutProvider value={ layout }>
			<IntersectionObserver.Provider value={ intersectionObserver }>
				{ blocks }
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
