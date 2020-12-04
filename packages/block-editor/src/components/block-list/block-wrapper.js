/**
 * External dependencies
 */
import classnames from 'classnames';
import { first, last, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	useRef,
	useEffect,
	useState,
	useContext,
	forwardRef,
} from '@wordpress/element';
import { focus, isTextField, placeCaretAtHorizontalEdge } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { __unstableGetBlockProps as getBlockProps } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../utils/dom';
import useMovingAnimation from '../use-moving-animation';
import { SetBlockNodes } from './root-container';
import { SelectionStart } from '../writing-flow';
import { BlockListBlockContext } from './block';
import ELEMENTS from './block-wrapper-elements';

/**
 * Transitions focus to the block or inner tabbable when the block becomes
 * selected.
 *
 * @param {Object} ref      React ref with the block element.
 * @param {string} clientId Block client ID.
 */
function useFocusFirstElement( ref, clientId ) {
	const initialPosition = useSelect(
		( select ) => {
			const {
				getSelectedBlocksInitialCaretPosition,
				isMultiSelecting,
				isNavigationMode,
				isBlockSelected,
			} = select( 'core/block-editor' );

			if ( ! isBlockSelected( clientId ) ) {
				return;
			}

			if ( isMultiSelecting() || isNavigationMode() ) {
				return;
			}

			return getSelectedBlocksInitialCaretPosition() || 1;
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! initialPosition ) {
			return;
		}

		const { ownerDocument } = ref.current;

		// Focus is captured by the wrapper node, so while focus transition
		// should only consider tabbables within editable display, since it
		// may be the wrapper itself or a side control which triggered the
		// focus event, don't unnecessary transition to an inner tabbable.
		if (
			ownerDocument.activeElement &&
			isInsideRootBlock( ref.current, ownerDocument.activeElement )
		) {
			return;
		}

		// Find all tabbables within node.
		const textInputs = focus.tabbable.find( ref.current ).filter(
			( node ) =>
				isTextField( node ) &&
				// Exclude inner blocks and block appenders
				isInsideRootBlock( ref.current, node ) &&
				! node.closest( '.block-list-appender' )
		);

		// If reversed (e.g. merge via backspace), use the last in the set of
		// tabbables.
		const isReverse = -1 === initialPosition;
		const target =
			( isReverse ? last : first )( textInputs ) || ref.current;

		placeCaretAtHorizontalEdge( target, isReverse );
	}, [ initialPosition ] );
}

/**
 * Returns true when the block is hovered and in navigation mode, false if not.
 *
 * @param {Object} ref React ref with the block element.
 *
 * @return {boolean} Hovered state.
 */
function useIsHovered( ref ) {
	const [ isHovered, setHovered ] = useState( false );
	const isNavigationMode = useSelect(
		( select ) => select( 'core/block-editor' ).isNavigationMode(),
		[]
	);

	useEffect( () => {
		if ( ! isNavigationMode ) {
			return;
		}

		function addListener( eventType, value ) {
			function listener( event ) {
				if ( event.defaultPrevented ) {
					return;
				}

				event.preventDefault();
				setHovered( value );
			}

			ref.current.addEventListener( eventType, listener );
			return () => {
				ref.current.removeEventListener( eventType, listener );
			};
		}

		if ( isHovered ) {
			return addListener( 'mouseout', false );
		}

		return addListener( 'mouseover', true );
	}, [ isNavigationMode, isHovered, setHovered ] );

	return isHovered;
}

/**
 * Returns the class names used for block moving mode.
 *
 * @param {string} clientId The block client ID to insert above.
 *
 * @return {string} The class names.
 */
function useBlockMovingModeClassNames( clientId ) {
	return useSelect(
		( select ) => {
			const {
				hasBlockMovingClientId,
				canInsertBlockType,
				getBlockName,
				getBlockRootClientId,
				isBlockSelected,
			} = select( 'core/block-editor' );

			// The classes are only relevant for the selected block. Avoid
			// re-rendering all blocks!
			if ( ! isBlockSelected( clientId ) ) {
				return;
			}

			const movingClientId = hasBlockMovingClientId();

			if ( ! movingClientId ) {
				return;
			}

			return classnames( 'is-block-moving-mode', {
				'can-insert-moving-block': canInsertBlockType(
					getBlockName( movingClientId ),
					getBlockRootClientId( clientId )
				),
			} );
		},
		[ clientId ]
	);
}

/**
 * This hook is used to lightly mark an element as a block element. The element
 * should be the outermost element of a block. Call this hook and pass the
 * returned props to the element to mark as a block. If you define a ref for the
 * element, it is important to pass the ref to this hook, which the hook in turn
 * will pass to the component through the props it returns. Optionally, you can
 * also pass any other props through this hook, and they will be merged and
 * returned.
 *
 * @param {Object}  props   Optional. Props to pass to the element. Must contain
 *                          the ref if one is defined.
 * @param {Object}  options Options for internal use only.
 * @param {boolean} options.__unstableIsHtml
 *
 * @return {Object} Props to pass to the element to mark as a block.
 */
export function useBlockProps( props = {}, { __unstableIsHtml } = {} ) {
	const fallbackRef = useRef();
	const ref = props.ref || fallbackRef;
	const onSelectionStart = useContext( SelectionStart );
	const setBlockNodes = useContext( SetBlockNodes );
	const {
		clientId,
		rootClientId,
		isSelected,
		isFirstMultiSelected,
		isLastMultiSelected,
		isPartOfMultiSelection,
		enableAnimation,
		index,
		className,
		name,
		mode,
		blockTitle,
		wrapperProps = {},
	} = useContext( BlockListBlockContext );
	const { insertDefaultBlock, removeBlock, selectBlock } = useDispatch(
		'core/block-editor'
	);

	// Provide the selected node, or the first and last nodes of a multi-
	// selection, so it can be used to position the contextual block toolbar.
	// We only provide what is necessary, and remove the nodes again when they
	// are no longer selected.
	useEffect( () => {
		if ( isSelected || isFirstMultiSelected || isLastMultiSelected ) {
			const node = ref.current;
			setBlockNodes( ( nodes ) => ( {
				...nodes,
				[ clientId ]: node,
			} ) );
			return () => {
				setBlockNodes( ( nodes ) => omit( nodes, clientId ) );
			};
		}
	}, [ isSelected, isFirstMultiSelected, isLastMultiSelected ] );

	// Set new block node if it changes.
	// This effect should happen on every render, so no dependencies should be
	// added.
	useEffect( () => {
		const node = ref.current;
		setBlockNodes( ( nodes ) => {
			if ( ! nodes[ clientId ] || nodes[ clientId ] === node ) {
				return nodes;
			}

			return { ...nodes, [ clientId ]: node };
		} );
	} );

	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockTitle );

	useFocusFirstElement( ref, clientId );

	// Block Reordering animation
	useMovingAnimation(
		ref,
		isSelected || isPartOfMultiSelection,
		isSelected || isFirstMultiSelected,
		enableAnimation,
		index
	);

	useEffect( () => {
		if ( ! isSelected ) {
			/**
			 * Marks the block as selected when focused and not already
			 * selected. This specifically handles the case where block does not
			 * set focus on its own (via `setFocus`), typically if there is no
			 * focusable input in the block.
			 *
			 * @param {FocusEvent} event Focus event.
			 */
			function onFocus( event ) {
				// If an inner block is focussed, that block is resposible for
				// setting the selected block.
				if ( ! isInsideRootBlock( ref.current, event.target ) ) {
					return;
				}

				selectBlock( clientId );
			}

			ref.current.addEventListener( 'focus', onFocus, true );

			return () => {
				ref.current.removeEventListener( 'focus', onFocus, true );
			};
		}

		/**
		 * Interprets keydown event intent to remove or insert after block if
		 * key event occurs on wrapper node. This can occur when the block has
		 * no text fields of its own, particularly after initial insertion, to
		 * allow for easy deletion and continuous writing flow to add additional
		 * content.
		 *
		 * @param {KeyboardEvent} event Keydown event.
		 */
		function onKeyDown( event ) {
			const { keyCode, target } = event;

			if (
				keyCode !== ENTER &&
				keyCode !== BACKSPACE &&
				keyCode !== DELETE
			) {
				return;
			}

			if ( target !== ref.current || isTextField( target ) ) {
				return;
			}

			event.preventDefault();

			if ( keyCode === ENTER ) {
				insertDefaultBlock( {}, rootClientId, index + 1 );
			} else {
				removeBlock( clientId );
			}
		}

		function onMouseLeave( { buttons } ) {
			// The primary button must be pressed to initiate selection.
			// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
			if ( buttons === 1 ) {
				onSelectionStart( clientId );
			}
		}

		/**
		 * Prevents default dragging behavior within a block. To do: we must
		 * handle this in the future and clean up the drag target.
		 *
		 * @param {DragEvent} event Drag event.
		 */
		function onDragStart( event ) {
			event.preventDefault();
		}

		ref.current.addEventListener( 'keydown', onKeyDown );
		ref.current.addEventListener( 'mouseleave', onMouseLeave );
		ref.current.addEventListener( 'dragstart', onDragStart );

		return () => {
			ref.current.removeEventListener( 'mouseleave', onMouseLeave );
			ref.current.removeEventListener( 'keydown', onKeyDown );
			ref.current.removeEventListener( 'dragstart', onDragStart );
		};
	}, [ isSelected, onSelectionStart, insertDefaultBlock, removeBlock ] );

	const isHovered = useIsHovered( ref );
	const blockMovingModeClassNames = useBlockMovingModeClassNames( clientId );
	const htmlSuffix = mode === 'html' && ! __unstableIsHtml ? '-visual' : '';

	return {
		...wrapperProps,
		...props,
		ref,
		id: `block-${ clientId }${ htmlSuffix }`,
		tabIndex: 0,
		role: 'group',
		'aria-label': blockLabel,
		'data-block': clientId,
		'data-type': name,
		'data-title': blockTitle,
		className: classnames(
			className,
			props.className,
			wrapperProps.className,
			blockMovingModeClassNames,
			{ 'is-hovered': isHovered }
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

const BlockComponent = forwardRef(
	( { children, tagName: TagName = 'div', ...props }, ref ) => {
		deprecated( 'wp.blockEditor.__experimentalBlock', {
			alternative: 'wp.blockEditor.useBlockProps',
		} );
		const blockProps = useBlockProps( { ...props, ref } );
		return <TagName { ...blockProps }>{ children }</TagName>;
	}
);

const ExtendedBlockComponent = ELEMENTS.reduce( ( acc, element ) => {
	acc[ element ] = forwardRef( ( props, ref ) => {
		return <BlockComponent { ...props } ref={ ref } tagName={ element } />;
	} );
	return acc;
}, BlockComponent );

export const Block = ExtendedBlockComponent;
