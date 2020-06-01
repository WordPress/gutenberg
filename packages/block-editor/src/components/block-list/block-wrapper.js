/**
 * External dependencies
 */
import classnames from 'classnames';
import { first, last, omit, upperFirst } from 'lodash';
import { animated } from 'react-spring/web.cjs';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useContext, forwardRef } from '@wordpress/element';
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
import { createHigherOrderComponent } from '@wordpress/compose';

function higherOrderComponent( Component ) {
	Component = animated( Component );

	function BlockWrapper( { children, __unstableIsHtml, ...props }, wrapper ) {
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
		const isAligned = wrapperProps && !! wrapperProps[ 'data-align' ];
		wrapper = wrapper || fallbackRef;

		// Provide the selected node, or the first and last nodes of a multi-
		// selection, so it can be used to position the contextual block toolbar.
		// We only provide what is necessary, and remove the nodes again when they
		// are no longer selected.
		useEffect( () => {
			if ( isSelected || isFirstMultiSelected || isLastMultiSelected ) {
				const node = wrapper.current;
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
		const animationStyle = useMovingAnimation(
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

		const blockWrapper = (
			<Component
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
					! isAligned && 'wp-block'
				) }
				data-block={ clientId }
				data-type={ name }
				data-title={ blockTitle }
				// Only allow shortcuts when a blocks is selected and not locked.
				onKeyDown={ isSelected && ! isLocked ? onKeyDown : undefined }
				// Only allow selection to be started from a selected block.
				onMouseLeave={ isSelected ? onMouseLeave : undefined }
				tabIndex="0"
				style={ {
					...( wrapperProps ? wrapperProps.style : {} ),
					...( props.style || {} ),
					...animationStyle,
				} }
			>
				{ children }
			</Component>
		);

		// For aligned blocks, provide a wrapper element so the block can be
		// positioned relative to the block column.
		if ( isAligned ) {
			const alignmentWrapperProps = {
				'data-align': wrapperProps[ 'data-align' ],
			};
			return (
				<div className="wp-block" { ...alignmentWrapperProps }>
					{ blockWrapper }
				</div>
			);
		}

		return blockWrapper;
	}

	return forwardRef( BlockWrapper );
}

export const block = createHigherOrderComponent(
	higherOrderComponent,
	'block'
);

ELEMENTS.forEach( ( element ) => {
	const ElementBlock = block( element );
	block[ element ] = ElementBlock;
	block[ upperFirst( element ) ] = ElementBlock;
} );
