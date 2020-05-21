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
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isInsideRootBlock } from '../../utils/dom';
import useMovingAnimation from '../use-moving-animation';
import { Context, SetBlockNodes } from './root-container';
import { BlockListBlockContext } from './block';
import ELEMENTS from './block-wrapper-elements';

const BlockComponent = forwardRef(
	(
		{ children, tagName: TagName = 'div', __unstableIsHtml, ...props },
		wrapper
	) => {
		const onSelectionStart = useContext( Context );
		const setBlockNodes = useContext( SetBlockNodes );
		const {
			clientId,
			rootClientId,
			isSelected,
			isFirstMultiSelected,
			isLastMultiSelected,
			isMultiSelecting,
			isNavigationMode,
			isPartOfMultiSelection,
			enableAnimation,
			index,
			className,
			isLocked,
			name,
			mode,
			blockTitle,
			wrapperProps,
		} = useContext( BlockListBlockContext );
		const { initialPosition } = useSelect(
			( select ) => {
				if ( ! isSelected ) {
					return {};
				}

				return {
					initialPosition: select(
						'core/block-editor'
					).getSelectedBlocksInitialCaretPosition(),
				};
			},
			[ isSelected ]
		);
		const { removeBlock, insertDefaultBlock } = useDispatch(
			'core/block-editor'
		);
		const fallbackRef = useRef();
		wrapper = wrapper || fallbackRef;

		// Handling isHovered
		const [ isBlockHovered, setBlockHoveredState ] = useState( false );

		/**
		 * Sets the block state as unhovered if currently hovering. There are cases
		 * where mouseleave may occur but the block is not hovered (multi-select),
		 * so to avoid unnecesary renders, the state is only set if hovered.
		 */
		const hideHoverEffects = () => {
			if ( isBlockHovered ) {
				setBlockHoveredState( false );
			}
		};
		/**
		 * A mouseover event handler to apply hover effect when a pointer device is
		 * placed within the bounds of the block. The mouseover event is preferred
		 * over mouseenter because it may be the case that a previous mouseenter
		 * event was blocked from being handled by a IgnoreNestedEvents component,
		 * therefore transitioning out of a nested block to the bounds of the block
		 * would otherwise not trigger a hover effect.
		 *
		 * @see https://developer.mozilla.org/en-US/docs/Web/Events/mouseenter
		 */
		const maybeHover = () => {
			if ( isBlockHovered || isPartOfMultiSelection || isSelected ) {
				return;
			}
			setBlockHoveredState( true );
		};

		// Provide the selected node, or the first and last nodes of a multi-
		// selection, so it can be used to position the contextual block toolbar.
		// We only provide what is necessary, and remove the nodes again when they
		// are no longer selected.
		useEffect( () => {
			if ( isSelected || isFirstMultiSelected || isLastMultiSelected ) {
				const node = wrapper.current;
				hideHoverEffects();
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
			// Focus is captured by the wrapper node, so while focus transition
			// should only consider tabbables within editable display, since it
			// may be the wrapper itself or a side control which triggered the
			// focus event, don't unnecessary transition to an inner tabbable.
			if (
				document.activeElement &&
				isInsideRootBlock( wrapper.current, document.activeElement )
			) {
				return;
			}

			// Find all tabbables within node.
			const textInputs = focus.tabbable
				.find( wrapper.current )
				.filter( isTextField )
				// Exclude inner blocks and block appenders
				.filter(
					( node ) =>
						isInsideRootBlock( wrapper.current, node ) &&
						! node.closest( '.block-list-appender' )
				);

			// If reversed (e.g. merge via backspace), use the last in the set of
			// tabbables.
			const isReverse = -1 === initialPosition;
			const target =
				( isReverse ? last : first )( textInputs ) || wrapper.current;

			placeCaretAtHorizontalEdge( target, isReverse );
		};

		useEffect( () => {
			if ( ! isMultiSelecting && ! isNavigationMode && isSelected ) {
				focusTabbable();
			}
		}, [ isSelected, isMultiSelecting, isNavigationMode ] );

		// Block Reordering animation
		useMovingAnimation(
			wrapper,
			isSelected || isPartOfMultiSelection,
			isSelected || isFirstMultiSelected,
			enableAnimation,
			index
		);

		/**
		 * Interprets keydown event intent to remove or insert after block if key
		 * event occurs on wrapper node. This can occur when the block has no text
		 * fields of its own, particularly after initial insertion, to allow for
		 * easy deletion and continuous writing flow to add additional content.
		 *
		 * @param {KeyboardEvent} event Keydown event.
		 */
		const onKeyDown = ( event ) => {
			const { keyCode, target } = event;

			if ( props.onKeyDown ) {
				props.onKeyDown( event );
			}

			if (
				keyCode !== ENTER &&
				keyCode !== BACKSPACE &&
				keyCode !== DELETE
			) {
				return;
			}

			if ( target !== wrapper.current || isTextField( target ) ) {
				return;
			}

			event.preventDefault();

			if ( keyCode === ENTER ) {
				insertDefaultBlock( {}, rootClientId, index + 1 );
			} else {
				removeBlock( clientId );
			}
		};

		const onMouseLeave = ( { which, buttons } ) => {
			hideHoverEffects();
			// The primary button must be pressed to initiate selection. Fall back
			// to `which` if the standard `buttons` property is falsy. There are
			// cases where Firefox might always set `buttons` to `0`.
			// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
			// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/which
			if ( ( buttons || which ) === 1 ) {
				onSelectionStart( clientId );
			}
		};

		const htmlSuffix =
			mode === 'html' && ! __unstableIsHtml ? '-visual' : '';
		const blockElementId = `block-${ clientId }${ htmlSuffix }`;

		return (
			<TagName
				// Overrideable props.
				aria-label={ blockLabel }
				role="group"
				{ ...omit( wrapperProps, [ 'data-align' ] ) }
				{ ...props }
				id={ blockElementId }
				ref={ wrapper }
				className={ classnames(
					className,
					props.className,
					wrapperProps && wrapperProps.className,
					{ 'is-hovered': isBlockHovered },
					! isAligned && 'wp-block'
				) }
				data-block={ clientId }
				data-type={ name }
				data-title={ blockTitle }
				onMouseOver={ maybeHover }
				onFocus={ maybeHover } // pre-commit hook requires this for now -shaun
				// Only allow shortcuts when a blocks is selected and not locked.
				onKeyDown={ isSelected && ! isLocked ? onKeyDown : undefined }
				// Only allow selection to be started from a selected block.
				onMouseLeave={ isSelected ? onMouseLeave : hideHoverEffects }
				tabIndex="0"
				style={ {
					...( wrapperProps ? wrapperProps.style : {} ),
					...( props.style || {} ),
				} }
			>
				{ children }
			</TagName>
		);
	}
);

const ExtendedBlockComponent = ELEMENTS.reduce( ( acc, element ) => {
	acc[ element ] = forwardRef( ( props, ref ) => {
		return <BlockComponent { ...props } ref={ ref } tagName={ element } />;
	} );
	return acc;
}, BlockComponent );

export const Block = ExtendedBlockComponent;
