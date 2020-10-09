/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import { useRef, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender, {
	AppenderNodesContext,
} from '../block-list-appender';
import RootContainer from './root-container';
import useBlockDropZone from '../use-block-drop-zone';

/**
 * A map to store the reference of each "Appenders" rendered with `rootClientId` as key.
 */
const appenderNodesMap = new Map();

/**
 * If the block count exceeds the threshold, we disable the reordering animation
 * to avoid laginess.
 */
const BLOCK_ANIMATION_THRESHOLD = 200;

function BlockList( { className, rootClientId, renderAppender }, ref ) {
	const Container = rootClientId ? 'div' : RootContainer;
	const fallbackRef = useRef();
	const wrapperRef = ref || fallbackRef;

	return (
		<AppenderNodesContext.Provider value={ appenderNodesMap }>
			<Container
				ref={ wrapperRef }
				className={ classnames(
					'block-editor-block-list__layout',
					className
				) }
			>
				<BlockListItems
					rootClientId={ rootClientId }
					renderAppender={ renderAppender }
					wrapperRef={ wrapperRef }
				/>
			</Container>
		</AppenderNodesContext.Provider>
	);
}

function Items( {
	rootClientId,
	renderAppender,
	__experimentalAppenderTagName,
	wrapperRef,
} ) {
	function selector( select ) {
		const {
			getBlockOrder,
			getBlockListSettings,
			getSelectedBlockClientId,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
			getGlobalBlockCount,
			isTyping,
			isDraggingBlocks,
		} = select( 'core/block-editor' );

		return {
			blockClientIds: getBlockOrder( rootClientId ),
			selectedBlockClientId: getSelectedBlockClientId(),
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
			orientation: getBlockListSettings( rootClientId )?.orientation,
			hasMultiSelection: hasMultiSelection(),
			enableAnimation:
				! isTyping() &&
				getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD,
			isDraggingBlocks: isDraggingBlocks(),
		};
	}

	const {
		blockClientIds,
		selectedBlockClientId,
		multiSelectedBlockClientIds,
		orientation,
		hasMultiSelection,
		enableAnimation,
		isDraggingBlocks,
	} = useSelect( selector, [ rootClientId ] );

	const dropTargetIndex = useBlockDropZone( {
		element: wrapperRef,
		rootClientId,
	} );

	const isAppenderDropTarget =
		dropTargetIndex === blockClientIds.length && isDraggingBlocks;

	return (
		<>
			{ blockClientIds.map( ( clientId, index ) => {
				const isBlockInSelection = hasMultiSelection
					? multiSelectedBlockClientIds.includes( clientId )
					: selectedBlockClientId === clientId;

				const isDropTarget =
					dropTargetIndex === index && isDraggingBlocks;

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
							enableAnimation={ enableAnimation }
							className={ classnames( {
								'is-drop-target': isDropTarget,
								'is-dropping-horizontally':
									isDropTarget &&
									orientation === 'horizontal',
							} ) }
						/>
					</AsyncModeProvider>
				);
			} ) }
			<BlockListAppender
				tagName={ __experimentalAppenderTagName }
				rootClientId={ rootClientId }
				renderAppender={ renderAppender }
				className={ classnames( {
					'is-drop-target': isAppenderDropTarget,
					'is-dropping-horizontally':
						isAppenderDropTarget && orientation === 'horizontal',
				} ) }
			/>
		</>
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

export default forwardRef( BlockList );
