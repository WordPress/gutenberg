/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useContext } from '@wordpress/element';
import { isTextField } from '@wordpress/dom';
import { ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { __unstableGetBlockProps as getBlockProps } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../../utils/dom';
import useMovingAnimation from '../../use-moving-animation';
import { SetBlockNodes } from '../root-container';
import { SelectionStart } from '../../writing-flow';
import { BlockListBlockContext } from '../block';
import { useFocusFirstElement } from './use-focus-first-element';
import { useIsHovered } from './use-is-hovered';
import { useBlockMovingModeClassNames } from './use-block-moving-mode-class-names';

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
