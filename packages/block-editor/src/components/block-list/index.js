/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import { useRef, createContext, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import useBlockDropZone from '../use-block-drop-zone';
import useInsertionPoint from './insertion-point';
import BlockPopover from './block-popover';

/**
 * If the block count exceeds the threshold, we disable the reordering animation
 * to avoid laginess.
 */
const BLOCK_ANIMATION_THRESHOLD = 200;

export const BlockNodes = createContext();
export const SetBlockNodes = createContext();

export default function BlockList( { className } ) {
	const ref = useRef();
	const [ blockNodes, setBlockNodes ] = useState( {} );
	const insertionPoint = useInsertionPoint( ref );

	useBlockDropZone( { element: ref } );

	return (
		<BlockNodes.Provider value={ blockNodes }>
			{ insertionPoint }
			<BlockPopover />
			<div
				ref={ ref }
				className={ classnames(
					'block-editor-block-list__layout is-root-container',
					className
				) }
			>
				<SetBlockNodes.Provider value={ setBlockNodes }>
					<BlockListItems />
				</SetBlockNodes.Provider>
			</div>
		</BlockNodes.Provider>
	);
}

function Items( {
	placeholder,
	rootClientId,
	renderAppender,
	__experimentalAppenderTagName,
} ) {
	function selector( select ) {
		const {
			getBlockOrder,
			getSettings,
			getSelectedBlockClientId,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
			getGlobalBlockCount,
			isTyping,
			__experimentalGetActiveBlockIdByBlockNames,
		} = select( 'core/block-editor' );

		// Determine if there is an active entity area to spotlight.
		const activeEntityBlockId = __experimentalGetActiveBlockIdByBlockNames(
			getSettings().__experimentalSpotlightEntityBlocks
		);

		return {
			blockClientIds: getBlockOrder( rootClientId ),
			selectedBlockClientId: getSelectedBlockClientId(),
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
			hasMultiSelection: hasMultiSelection(),
			enableAnimation:
				! isTyping() &&
				getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD,
			activeEntityBlockId,
		};
	}

	const {
		blockClientIds,
		selectedBlockClientId,
		multiSelectedBlockClientIds,
		hasMultiSelection,
		enableAnimation,
		activeEntityBlockId,
	} = useSelect( selector, [ rootClientId ] );

	return (
		<>
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
							clientId={ clientId }
							// This prop is explicitely computed and passed down
							// to avoid being impacted by the async mode
							// otherwise there might be a small delay to trigger the animation.
							index={ index }
							enableAnimation={ enableAnimation }
							className={ classnames( {
								'has-active-entity': activeEntityBlockId,
							} ) }
							activeEntityBlockId={ activeEntityBlockId }
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
