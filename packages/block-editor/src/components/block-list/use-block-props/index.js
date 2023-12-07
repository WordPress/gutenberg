/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	__unstableGetBlockProps as getBlockProps,
	getBlockType,
	isReusableBlock,
	getBlockDefaultClassName,
	store as blocksStore,
} from '@wordpress/blocks';
import { useMergeRefs, useDisabled } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import useMovingAnimation from '../../use-moving-animation';
import { BlockListBlockContext } from '../block-list-block-context';
import { useFocusFirstElement } from './use-focus-first-element';
import { useIsHovered } from './use-is-hovered';
import { useBlockEditContext } from '../../block-edit/context';
import { useFocusHandler } from './use-focus-handler';
import { useEventHandlers } from './use-selected-block-event-handlers';
import { useNavModeExit } from './use-nav-mode-exit';
import { useBlockRefProvider } from './use-block-refs';
import { useIntersectionObserver } from './use-intersection-observer';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * If the block count exceeds the threshold, we disable the reordering animation
 * to avoid laginess.
 */
const BLOCK_ANIMATION_THRESHOLD = 200;

/**
 * This hook is used to lightly mark an element as a block element. The element
 * should be the outermost element of a block. Call this hook and pass the
 * returned props to the element to mark as a block. If you define a ref for the
 * element, it is important to pass the ref to this hook, which the hook in turn
 * will pass to the component through the props it returns. Optionally, you can
 * also pass any other props through this hook, and they will be merged and
 * returned.
 *
 * Use of this hook on the outermost element of a block is required if using API >= v2.
 *
 * @example
 * ```js
 * import { useBlockProps } from '@wordpress/block-editor';
 *
 * export default function Edit() {
 *
 *   const blockProps = useBlockProps(
 *     className: 'my-custom-class',
 *     style: {
 *       color: '#222222',
 *       backgroundColor: '#eeeeee'
 *     }
 *   )
 *
 *   return (
 *	    <div { ...blockProps }>
 *
 *     </div>
 *   )
 * }
 *
 * ```
 *
 *
 * @param {Object}  props                    Optional. Props to pass to the element. Must contain
 *                                           the ref if one is defined.
 * @param {Object}  options                  Options for internal use only.
 * @param {boolean} options.__unstableIsHtml
 *
 * @return {Object} Props to pass to the element to mark as a block.
 */
export function useBlockProps( props = {}, { __unstableIsHtml } = {} ) {
	const {
		clientId,
		className,
		wrapperProps = {},
		isAligned,
	} = useContext( BlockListBlockContext );
	const {
		index,
		mode,
		name,
		blockApiVersion,
		blockTitle,
		isSelected,
		isPartOfSelection,
		adjustScrolling,
		enableAnimation,
		isSubtreeDisabled,
		isOutlineEnabled,
		hasOverlay,
		initialPosition,
		classNames,
	} = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlockIndex,
				getBlockMode,
				getBlockName,
				isTyping,
				getGlobalBlockCount,
				isBlockSelected,
				isBlockMultiSelected,
				isAncestorMultiSelected,
				isFirstMultiSelectedBlock,
				isBlockSubtreeDisabled,
				getSettings,
				isBlockHighlighted,
				__unstableIsFullySelected,
				__unstableSelectionHasUnmergeableBlock,
				isBlockBeingDragged,
				hasSelectedInnerBlock,
				hasBlockMovingClientId,
				canInsertBlockType,
				getBlockRootClientId,
				__unstableHasActiveBlockOverlayActive,
				__unstableGetEditorMode,
				getSelectedBlocksInitialCaretPosition,
			} = unlock( select( blockEditorStore ) );
			const { getActiveBlockVariation } = select( blocksStore );
			const _isSelected = isBlockSelected( clientId );
			const isPartOfMultiSelection =
				isBlockMultiSelected( clientId ) ||
				isAncestorMultiSelected( clientId );
			const blockName = getBlockName( clientId );
			const blockType = getBlockType( blockName );
			const attributes = getBlockAttributes( clientId );
			const match = getActiveBlockVariation( blockName, attributes );
			const { outlineMode } = getSettings();
			const isMultiSelected = isBlockMultiSelected( clientId );
			const checkDeep = true;
			const isAncestorOfSelectedBlock = hasSelectedInnerBlock(
				clientId,
				checkDeep
			);
			const typing = isTyping();
			const hasLightBlockWrapper = blockType?.apiVersion > 1;
			const movingClientId = hasBlockMovingClientId();

			return {
				index: getBlockIndex( clientId ),
				mode: getBlockMode( clientId ),
				name: blockName,
				blockApiVersion: blockType?.apiVersion || 1,
				blockTitle: match?.title || blockType?.title,
				isSelected: _isSelected,
				isPartOfSelection: _isSelected || isPartOfMultiSelection,
				adjustScrolling:
					_isSelected || isFirstMultiSelectedBlock( clientId ),
				enableAnimation:
					! typing &&
					getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD,
				isSubtreeDisabled: isBlockSubtreeDisabled( clientId ),
				isOutlineEnabled: outlineMode,
				hasOverlay: __unstableHasActiveBlockOverlayActive( clientId ),
				initialPosition:
					_isSelected && __unstableGetEditorMode() === 'edit'
						? getSelectedBlocksInitialCaretPosition()
						: undefined,
				classNames: classnames( {
					'is-selected': _isSelected,
					'is-highlighted': isBlockHighlighted( clientId ),
					'is-multi-selected': isMultiSelected,
					'is-partially-selected':
						isMultiSelected &&
						! __unstableIsFullySelected() &&
						! __unstableSelectionHasUnmergeableBlock(),
					'is-reusable': isReusableBlock( blockType ),
					'is-dragging': isBlockBeingDragged( clientId ),
					'has-child-selected': isAncestorOfSelectedBlock,
					'remove-outline': _isSelected && outlineMode && typing,
					'is-block-moving-mode': !! movingClientId,
					'can-insert-moving-block':
						movingClientId &&
						canInsertBlockType(
							getBlockName( movingClientId ),
							getBlockRootClientId( clientId )
						),
					[ attributes.className ]: hasLightBlockWrapper,
					[ getBlockDefaultClassName( blockName ) ]:
						hasLightBlockWrapper,
				} ),
			};
		},
		[ clientId ]
	);

	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockTitle );
	const htmlSuffix = mode === 'html' && ! __unstableIsHtml ? '-visual' : '';
	const mergedRefs = useMergeRefs( [
		props.ref,
		useFocusFirstElement( { clientId, initialPosition } ),
		useBlockRefProvider( clientId ),
		useFocusHandler( clientId ),
		useEventHandlers( { clientId, isSelected } ),
		useNavModeExit( clientId ),
		useIsHovered( { isEnabled: isOutlineEnabled } ),
		useIntersectionObserver(),
		useMovingAnimation( {
			isSelected: isPartOfSelection,
			adjustScrolling,
			enableAnimation,
			triggerAnimationOnChange: index,
		} ),
		useDisabled( { isDisabled: ! hasOverlay } ),
	] );

	const blockEditContext = useBlockEditContext();
	// Ensures it warns only inside the `edit` implementation for the block.
	if ( blockApiVersion < 2 && clientId === blockEditContext.clientId ) {
		warning(
			`Block type "${ name }" must support API version 2 or higher to work correctly with "useBlockProps" method.`
		);
	}

	return {
		tabIndex: 0,
		...wrapperProps,
		...props,
		ref: mergedRefs,
		id: `block-${ clientId }${ htmlSuffix }`,
		role: 'document',
		'aria-label': blockLabel,
		'data-block': clientId,
		'data-type': name,
		'data-title': blockTitle,
		inert: isSubtreeDisabled ? 'true' : undefined,
		className: classnames(
			'block-editor-block-list__block',
			{
				// The wp-block className is important for editor styles.
				'wp-block': ! isAligned,
				'has-block-overlay': hasOverlay,
			},
			className,
			props.className,
			wrapperProps.className,
			classNames
		),
		style: { ...wrapperProps.style, ...props.style },
	};
}

/**
 * Call within a save function to get the props for the block wrapper.
 *
 * @param {Object} props Optional. Props to pass to the element.
 */
useBlockProps.save = getBlockProps;
