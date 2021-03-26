/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useRef, useMemo } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import { store as blockEditorStore } from '../../store';
import { __unstableUseBlockElement as useBlockElement } from './use-block-props/use-block-refs';

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
	showInsertionPoint,
} ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const ref = useRef();
	const {
		orientation,
		isHidden,
		previousClientId,
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
				previousClientId: previous,
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
	const previousElement = useBlockElement( previousClientId );
	const nextElement = useBlockElement( nextClientId );
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
	const [ isInserterForced, setIsInserterForced ] = useState( false );
	const {
		isMultiSelecting,
		isInserterVisible,
		selectedClientId,
		selectedRootClientId,
		isInserterShown,
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
			isInserterShown: insertionPoint.withInserter,
		};
	}, [] );

	const isVisible = isInserterShown || isInserterForced || isInserterVisible;

	return (
		! isMultiSelecting &&
		isVisible && (
			<InsertionPointPopover
				clientId={ selectedClientId }
				selectedRootClientId={ selectedRootClientId }
				isInserterShown={ isInserterShown }
				isInserterForced={ isInserterForced }
				setIsInserterForced={ ( value ) => {
					setIsInserterForced( value );
				} }
				showInsertionPoint={ isInserterVisible }
			/>
		)
	);
}
