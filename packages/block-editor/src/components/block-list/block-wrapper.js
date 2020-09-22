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

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../utils/dom';
import useMovingAnimation from '../use-moving-animation';
import { Context, SetBlockNodes } from './root-container';
import { BlockListBlockContext } from './block';
import ELEMENTS from './block-wrapper-elements';

/**
 * This hook is used to lighly mark an element as a block element. Call this
 * hook and pass the returned props to the element to mark as a block. If you
 * define a ref for the element, it is important to pass the ref to this hook,
 * which the hooks in turn will pass to the component through the props it
 * returns. Optionally, you can also pass any other props through this hook, and
 * they will be merged and returned.
 *
 * @param {Object}  props   Optional. Props to pass to the element. Must contain
 *                          the ref if one is defined.
 * @param {Object}  options Options for internal use only.
 * @param {boolean} options.__unstableIsHtml
 *
 * @return {Object} Props to pass to the element to mark as a block.
 */
export function useBlockWrapperProps( props = {}, { __unstableIsHtml } = {} ) {
	const fallbackRef = useRef();
	const ref = props.ref || fallbackRef;
	const onSelectionStart = useContext( Context );
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
	const {
		initialPosition,
		shouldFocusFirstElement,
		isNavigationMode,
	} = useSelect(
		( select ) => {
			const {
				getSelectedBlocksInitialCaretPosition,
				isMultiSelecting: _isMultiSelecting,
				isNavigationMode: _isNavigationMode,
			} = select( 'core/block-editor' );

			return {
				shouldFocusFirstElement:
					isSelected &&
					! _isMultiSelecting() &&
					! _isNavigationMode(),
				initialPosition: isSelected
					? getSelectedBlocksInitialCaretPosition()
					: undefined,
				isNavigationMode: _isNavigationMode,
			};
		},
		[ isSelected ]
	);
	const { insertDefaultBlock, removeBlock } = useDispatch(
		'core/block-editor'
	);
	const [ isHovered, setHovered ] = useState( false );

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

	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockTitle );

	// Handing the focus of the block on creation and update

	/**
	 * When a block becomes selected, transition focus to an inner tabbable.
	 */
	const focusTabbable = () => {
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
	};

	useEffect( () => {
		if ( shouldFocusFirstElement ) {
			focusTabbable();
		}
	}, [ shouldFocusFirstElement ] );

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
			return;
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

		ref.current.addEventListener( 'keydown', onKeyDown );
		ref.current.addEventListener( 'mouseleave', onMouseLeave );

		return () => {
			ref.current.removeEventListener( 'mouseleave', onMouseLeave );
			ref.current.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ isSelected, onSelectionStart, insertDefaultBlock, removeBlock ] );

	useEffect( () => {
		if ( ! isNavigationMode ) {
			return;
		}

		function onMouseOver( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			event.preventDefault();

			if ( isHovered ) {
				return;
			}

			setHovered( true );
		}

		function onMouseOut( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			event.preventDefault();

			if ( ! isHovered ) {
				return;
			}

			setHovered( false );
		}

		ref.current.addEventListener( 'mouseover', onMouseOver );
		ref.current.addEventListener( 'mouseout', onMouseOut );

		return () => {
			ref.current.removeEventListener( 'mouseover', onMouseOver );
			ref.current.removeEventListener( 'mouseout', onMouseOut );
		};
	}, [ isNavigationMode, isHovered, setHovered ] );

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
			{ 'is-hovered': isHovered }
		),
		style: { ...wrapperProps.style, ...props.style },
	};
}

const BlockComponent = forwardRef(
	( { children, tagName: TagName = 'div', ...props }, ref ) => {
		deprecated( 'wp.blockEditor.__experimentalBlock', {
			alternative: 'wp.blockEditor.__experimentalUseBlockWrapperProps',
		} );
		const blockWrapperProps = useBlockWrapperProps( { ...props, ref } );
		return <TagName { ...blockWrapperProps }>{ children }</TagName>;
	}
);

const ExtendedBlockComponent = ELEMENTS.reduce( ( acc, element ) => {
	acc[ element ] = forwardRef( ( props, ref ) => {
		return <BlockComponent { ...props } ref={ ref } tagName={ element } />;
	} );
	return acc;
}, BlockComponent );

export const Block = ExtendedBlockComponent;
