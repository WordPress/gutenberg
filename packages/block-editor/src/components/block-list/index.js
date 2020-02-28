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
import BlockListAppender from '../block-list-appender';
import RootContainer from './root-container';
import useBlockDropZone from '../block-drop-zone';

/**
 * If the block count exceeds the threshold, we disable the reordering animation
 * to avoid laginess.
 */
const BLOCK_ANIMATION_THRESHOLD = 200;

function BlockList(
	{
		className,
		rootClientId,
		isDraggable,
		renderAppender,
		__experimentalUIParts = {},
		tagName = 'div',
		...props
	},
	ref
) {
	function selector( select ) {
		const {
			getBlockOrder,
			isMultiSelecting,
			getSelectedBlockClientId,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
			getGlobalBlockCount,
			isTyping,
		} = select( 'core/block-editor' );

		return {
			blockClientIds: getBlockOrder( rootClientId ),
			isMultiSelecting: isMultiSelecting(),
			selectedBlockClientId: getSelectedBlockClientId(),
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
			hasMultiSelection: hasMultiSelection(),
			enableAnimation:
				! isTyping() &&
				getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD,
		};
	}

	const {
		blockClientIds,
		isMultiSelecting,
		selectedBlockClientId,
		multiSelectedBlockClientIds,
		hasMultiSelection,
		enableAnimation,
	} = useSelect( selector, [ rootClientId ] );

	const Container = rootClientId ? tagName : RootContainer;
	const targetClientId = useBlockDropZone( {
		element: ref,
		rootClientId,
	} );
	const __experimentalContainerProps = rootClientId
		? {}
		: { hasPopover: __experimentalUIParts.hasPopover };

	return (
		<Container
			ref={ ref }
			className={ classnames(
				'block-editor-block-list__layout',
				className
			) }
			{ ...__experimentalContainerProps }
			{ ...props }
		>
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
							isDraggable={ isDraggable }
							isMultiSelecting={ isMultiSelecting }
							// This prop is explicitely computed and passed down
							// to avoid being impacted by the async mode
							// otherwise there might be a small delay to trigger the animation.
							index={ index }
							enableAnimation={ enableAnimation }
							hasSelectedUI={
								__experimentalUIParts.hasSelectedUI
							}
							className={
								clientId === targetClientId
									? 'is-drop-target'
									: undefined
							}
						/>
					</AsyncModeProvider>
				);
			} ) }
			<BlockListAppender
				rootClientId={ rootClientId }
				renderAppender={ renderAppender }
				className={
					targetClientId === null ? 'is-drop-target' : undefined
				}
			/>
		</Container>
	);
}

const ForwardedBlockList = forwardRef( BlockList );

// This component needs to always be synchronous
// as it's the one changing the async mode
// depending on the block selection.
export default forwardRef( ( props, ref ) => {
	const fallbackRef = useRef();
	return (
		<AsyncModeProvider value={ false }>
			<ForwardedBlockList ref={ ref || fallbackRef } { ...props } />
		</AsyncModeProvider>
	);
} );
