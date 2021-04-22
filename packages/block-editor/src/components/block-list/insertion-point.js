/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useState,
	useEffect,
	useCallback,
	useRef,
	useMemo,
} from '@wordpress/element';
import { Popover } from '@wordpress/components';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import { getBlockDOMNode } from '../../utils/dom';
import { store as blockEditorStore } from '../../store';

function InsertionPointInserter( {
	clientId,
	rootClientId,
	setIsInserterForced,
} ) {
	return (
		<div
			className={ classnames(
				'block-editor-block-list__insertion-point-inserter'
			) }
		>
			<Inserter
				position="bottom center"
				clientId={ clientId }
				rootClientId={ rootClientId }
				__experimentalIsQuick
				onToggle={ setIsInserterForced }
				onSelectOrClose={ () => setIsInserterForced( false ) }
			/>
		</div>
	);
}

function InsertionPointPopover( {
	clientId,
	selectedRootClientId,
	isInserterShown,
	isInserterForced,
	setIsInserterForced,
	containerRef,
	showInsertionPoint,
} ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const ref = useRef();

	const {
		previousElement,
		nextElement,
		orientation,
		isHidden,
		nextClientId,
		rootClientId,
	} = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getBlockRootClientId,
				getBlockListSettings,
				getMultiSelectedBlockClientIds,
				getSelectedBlockClientId,
				hasMultiSelection,
				getSettings,
			} = select( blockEditorStore );
			const { ownerDocument } = containerRef.current;
			const targetRootClientId = clientId
				? getBlockRootClientId( clientId )
				: selectedRootClientId;
			const blockOrder = getBlockOrder( targetRootClientId );
			if ( ! blockOrder.length ) {
				return {};
			}
			const previous = clientId
				? clientId
				: blockOrder[ blockOrder.length - 1 ];
			const isLast = previous === blockOrder[ blockOrder.length - 1 ];
			const next = isLast
				? null
				: blockOrder[ blockOrder.indexOf( previous ) + 1 ];
			const { hasReducedUI } = getSettings();
			const multiSelectedBlockClientIds = getMultiSelectedBlockClientIds();
			const selectedBlockClientId = getSelectedBlockClientId();
			const blockOrientation =
				getBlockListSettings( targetRootClientId )?.orientation ||
				'vertical';

			return {
				previousElement: getBlockDOMNode( previous, ownerDocument ),
				nextElement: getBlockDOMNode( next, ownerDocument ),
				nextClientId: next,
				isHidden:
					hasReducedUI ||
					( hasMultiSelection()
						? next && multiSelectedBlockClientIds.includes( next )
						: next &&
						  blockOrientation === 'vertical' &&
						  next === selectedBlockClientId ),
				orientation: blockOrientation,
				rootClientId: targetRootClientId,
			};
		},
		[ clientId, selectedRootClientId ]
	);

	const style = useMemo( () => {
		if ( ! previousElement ) {
			return {};
		}
		const previousRect = previousElement.getBoundingClientRect();
		const nextRect = nextElement
			? nextElement.getBoundingClientRect()
			: null;

		if ( orientation === 'vertical' ) {
			return {
				width: previousElement.offsetWidth,
				height: nextRect ? nextRect.top - previousRect.bottom : 0,
			};
		}

		let width = 0;
		if ( nextElement ) {
			width = isRTL()
				? previousRect.left - nextRect.right
				: nextRect.left - previousRect.right;
		}

		return {
			width,
			height: previousElement.offsetHeight,
		};
	}, [ previousElement, nextElement ] );

	const getAnchorRect = useCallback( () => {
		const previousRect = previousElement.getBoundingClientRect();
		const nextRect = nextElement
			? nextElement.getBoundingClientRect()
			: null;
		if ( orientation === 'vertical' ) {
			if ( isRTL() ) {
				return {
					top: previousRect.bottom,
					left: previousRect.right,
					right: previousRect.left,
					bottom: nextRect ? nextRect.top : previousRect.bottom,
				};
			}

			return {
				top: previousRect.bottom,
				left: previousRect.left,
				right: previousRect.right,
				bottom: nextRect ? nextRect.top : previousRect.bottom,
			};
		}

		if ( isRTL() ) {
			return {
				top: previousRect.top,
				left: nextRect ? nextRect.right : previousRect.left,
				right: previousRect.left,
				bottom: previousRect.bottom,
			};
		}

		return {
			top: previousRect.top,
			left: previousRect.right,
			right: nextRect ? nextRect.left : previousRect.right,
			bottom: previousRect.bottom,
		};
	}, [ previousElement, nextElement ] );

	if ( ! previousElement ) {
		return null;
	}

	const className = classnames(
		'block-editor-block-list__insertion-point',
		'is-' + orientation
	);

	function onClick( event ) {
		if ( event.target === ref.current && nextClientId ) {
			selectBlock( nextClientId, -1 );
		}
	}

	function onFocus( event ) {
		// Only handle click on the wrapper specifically, and not an event
		// bubbled from the inserter itself.
		if ( event.target !== ref.current ) {
			setIsInserterForced( true );
		}
	}

	// Only show the inserter when there's a `nextElement` (a block after the
	// insertion point). At the end of the block list the trailing appender
	// should serve the purpose of inserting blocks.
	const showInsertionPointInserter =
		! isHidden && nextElement && ( isInserterShown || isInserterForced );

	// Show the indicator if the insertion point inserter is visible, or if
	// the `showInsertionPoint` state is `true`. The latter is generally true
	// when hovering blocks for insertion in the block library.
	const showInsertionPointIndicator =
		showInsertionPointInserter || ( ! isHidden && showInsertionPoint );

	/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
	// While ideally it would be enough to capture the
	// bubbling focus event from the Inserter, due to the
	// characteristics of click focusing of `button`s in
	// Firefox and Safari, it is not reliable.
	//
	// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
	return (
		<Popover
			noArrow
			animate={ false }
			getAnchorRect={ getAnchorRect }
			focusOnMount={ false }
			className="block-editor-block-list__insertion-point-popover"
			__unstableSlotName="block-toolbar"
		>
			<div
				ref={ ref }
				tabIndex={ -1 }
				onClick={ onClick }
				onFocus={ onFocus }
				className={ classnames( className, {
					'is-with-inserter': showInsertionPointInserter,
				} ) }
				style={ style }
			>
				{ showInsertionPointIndicator && (
					<div className="block-editor-block-list__insertion-point-indicator" />
				) }
				{ showInsertionPointInserter && (
					<InsertionPointInserter
						rootClientId={ rootClientId }
						clientId={ nextClientId }
						setIsInserterForced={ setIsInserterForced }
					/>
				) }
			</div>
		</Popover>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
}

export default function useInsertionPoint( ref ) {
	const [ isInserterShown, setIsInserterShown ] = useState( false );
	const [ isInserterForced, setIsInserterForced ] = useState( false );
	const [ inserterClientId, setInserterClientId ] = useState( null );
	const {
		isMultiSelecting,
		isInserterVisible,
		selectedClientId,
		selectedRootClientId,
	} = useSelect( ( select ) => {
		const {
			isMultiSelecting: _isMultiSelecting,
			isBlockInsertionPointVisible,
			getBlockInsertionPoint,
			getBlockOrder,
		} = select( blockEditorStore );

		const insertionPoint = getBlockInsertionPoint();
		const order = getBlockOrder( insertionPoint.rootClientId );

		return {
			isMultiSelecting: _isMultiSelecting(),
			isInserterVisible: isBlockInsertionPointVisible(),
			selectedClientId: order[ insertionPoint.index - 1 ],
			selectedRootClientId: insertionPoint.rootClientId,
		};
	}, [] );
	const { getBlockListSettings } = useSelect( blockEditorStore );

	const onMouseMove = useCallback(
		( event ) => {
			if (
				! event.target.classList.contains(
					'block-editor-block-list__layout'
				)
			) {
				if ( isInserterShown ) {
					setIsInserterShown( false );
				}
				return;
			}

			let rootClientId;
			if ( ! event.target.classList.contains( 'is-root-container' ) ) {
				const blockElement = !! event.target.getAttribute(
					'data-block'
				)
					? event.target
					: event.target.closest( '[data-block]' );
				rootClientId = blockElement.getAttribute( 'data-block' );
			}

			const orientation =
				getBlockListSettings( rootClientId )?.orientation || 'vertical';
			const rect = event.target.getBoundingClientRect();
			const offsetTop = event.clientY - rect.top;
			const offsetLeft = event.clientX - rect.left;

			const children = Array.from( event.target.children );
			const nextElement = children.find( ( blockEl ) => {
				return (
					( blockEl.classList.contains( 'wp-block' ) &&
						orientation === 'vertical' &&
						blockEl.offsetTop > offsetTop ) ||
					( blockEl.classList.contains( 'wp-block' ) &&
						orientation === 'horizontal' &&
						blockEl.offsetLeft > offsetLeft )
				);
			} );

			let element = nextElement
				? children[ children.indexOf( nextElement ) - 1 ]
				: children[ children.length - 1 ];

			if ( ! element ) {
				return;
			}

			// The block may be in an alignment wrapper, so check the first direct
			// child if the element has no ID.
			if ( ! element.id ) {
				element = element.firstElementChild;

				if ( ! element ) {
					return;
				}
			}

			const clientId = element.id.slice( 'block-'.length );

			if ( ! clientId ) {
				return;
			}

			const elementRect = element.getBoundingClientRect();

			if (
				( orientation === 'horizontal' &&
					( event.clientY > elementRect.bottom ||
						event.clientY < elementRect.top ) ) ||
				( orientation === 'vertical' &&
					( event.clientX > elementRect.right ||
						event.clientX < elementRect.left ) )
			) {
				if ( isInserterShown ) {
					setIsInserterShown( false );
				}
				return;
			}

			setIsInserterShown( true );
			setInserterClientId( clientId );
		},
		[ isInserterShown, setIsInserterShown, setInserterClientId ]
	);

	const enableMouseMove = ! isInserterForced && ! isMultiSelecting;

	useEffect( () => {
		if ( ! enableMouseMove ) {
			return;
		}

		ref.current.addEventListener( 'mousemove', onMouseMove );

		return () => {
			ref.current.removeEventListener( 'mousemove', onMouseMove );
		};
	}, [ enableMouseMove, onMouseMove ] );

	const isVisible = isInserterShown || isInserterForced || isInserterVisible;

	return (
		! isMultiSelecting &&
		isVisible && (
			<InsertionPointPopover
				clientId={
					isInserterVisible ? selectedClientId : inserterClientId
				}
				selectedRootClientId={ selectedRootClientId }
				isInserterShown={ isInserterShown }
				isInserterForced={ isInserterForced }
				setIsInserterForced={ ( value ) => {
					setIsInserterForced( value );
					if ( ! value ) {
						setIsInserterShown( value );
					}
				} }
				containerRef={ ref }
				showInsertionPoint={ isInserterVisible }
			/>
		)
	);
}
