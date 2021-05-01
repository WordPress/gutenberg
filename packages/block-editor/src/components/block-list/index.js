/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import { useViewportMatch, useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import useBlockDropZone from '../use-block-drop-zone';
import { useInBetweenInserter } from './use-in-between-inserter';
import BlockTools from '../block-tools';
import { store as blockEditorStore } from '../../store';
import { usePreParsePatterns } from '../../utils/pre-parse-patterns';
import { LayoutProvider, defaultLayout } from './layout';

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
		<BlockTools>
			<Root className={ className }>
				<BlockListItems __experimentalLayout={ __experimentalLayout } />
			</Root>
		</BlockTools>
	);
}

function Items( {
	placeholder,
	rootClientId,
	renderAppender,
	__experimentalAppenderTagName,
	__experimentalLayout: layout = defaultLayout,
} ) {
	function selector( select ) {
		const {
			getBlockOrder,
			getSelectedBlockClientId,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
		} = select( blockEditorStore );
		return {
			blockClientIds: getBlockOrder( rootClientId ),
			selectedBlockClientId: getSelectedBlockClientId(),
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
			hasMultiSelection: hasMultiSelection(),
		};
	}

	const {
		blockClientIds,
		selectedBlockClientId,
		multiSelectedBlockClientIds,
		hasMultiSelection,
	} = useSelect( selector, [ rootClientId ] );

	return (
		<LayoutProvider value={ layout }>
			{ blockClientIds.map( ( clientId, index ) => {
				const isBlockInSelection = hasMultiSelection
					? multiSelectedBlockClientIds.includes( clientId )
					: selectedBlockClientId === clientId;

				return (
					<AsyncModeProvider
						key={ clientId }
						value={ ! isBlockInSelection }
					>
						<BlockListBlock
							rootClientId={ rootClientId }
							clientId={ clientId }
							// This prop is explicitely computed and passed down
							// to avoid being impacted by the async mode
							// otherwise there might be a small delay to trigger the animation.
							index={ index }
						/>
					</AsyncModeProvider>
				);
			} ) }
			{ blockClientIds.length < 1 && placeholder }
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
