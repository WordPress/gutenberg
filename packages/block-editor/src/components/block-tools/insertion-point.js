/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRef, createContext, useContext } from '@wordpress/element';
import { __unstableMotion as motion } from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import { store as blockEditorStore } from '../../store';
import BlockPopoverInbetween from '../block-popover/inbetween';
import BlockDropZonePopover from '../block-popover/drop-zone';

export const InsertionPointOpenRef = createContext();

function InbetweenInsertionPointPopover( {
	__unstablePopoverSlot,
	__unstableContentRef,
	operation = 'insert',
	nearestSide = 'right',
} ) {
	const { selectBlock, hideInsertionCue } = useDispatch( blockEditorStore );
	const openRef = useContext( InsertionPointOpenRef );
	const ref = useRef();
	const {
		orientation,
		previousClientId,
		nextClientId,
		rootClientId,
		isInserterShown,
		isDistractionFree,
		isNavigationMode,
		isZoomOutMode,
	} = useSelect( ( select ) => {
		const {
			getBlockOrder,
			getBlockListSettings,
			getInsertionCue,
			isBlockBeingDragged,
			getPreviousBlockClientId,
			getNextBlockClientId,
			getSettings,
			isNavigationMode: _isNavigationMode,
			__unstableGetEditorMode,
		} = select( blockEditorStore );
		const insertionCue = getInsertionCue();
		const order = getBlockOrder( insertionCue.rootClientId );

		if ( ! order.length ) {
			return {};
		}

		let _previousClientId = order[ insertionCue.index - 1 ];
		let _nextClientId = order[ insertionCue.index ];

		while ( isBlockBeingDragged( _previousClientId ) ) {
			_previousClientId = getPreviousBlockClientId( _previousClientId );
		}

		while ( isBlockBeingDragged( _nextClientId ) ) {
			_nextClientId = getNextBlockClientId( _nextClientId );
		}

		const settings = getSettings();

		return {
			previousClientId: _previousClientId,
			nextClientId: _nextClientId,
			orientation:
				getBlockListSettings( insertionCue.rootClientId )
					?.orientation || 'vertical',
			rootClientId: insertionCue.rootClientId,
			isNavigationMode: _isNavigationMode(),
			isDistractionFree: settings.isDistractionFree,
			isInserterShown: insertionCue?.__unstableWithInserter,
			isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
		};
	}, [] );
	const { getBlockEditingMode } = useSelect( blockEditorStore );

	const disableMotion = useReducedMotion();

	function onClick( event ) {
		if (
			event.target === ref.current &&
			nextClientId &&
			getBlockEditingMode( nextClientId ) !== 'disabled'
		) {
			selectBlock( nextClientId, -1 );
		}
	}

	function maybeHideInserterPoint( event ) {
		// Only hide the inserter if it's triggered on the wrapper,
		// and the inserter is not open.
		if ( event.target === ref.current && ! openRef.current ) {
			hideInsertionCue();
		}
	}

	function onFocus( event ) {
		// Only handle click on the wrapper specifically, and not an event
		// bubbled from the inserter itself.
		if ( event.target !== ref.current ) {
			openRef.current = true;
		}
	}

	const lineVariants = {
		// Initial position starts from the center and invisible.
		start: {
			opacity: 0,
			scale: 0,
		},
		// The line expands to fill the container. If the inserter is visible it
		// is delayed so it appears orchestrated.
		rest: {
			opacity: 1,
			scale: 1,
			transition: { delay: isInserterShown ? 0.5 : 0, type: 'tween' },
		},
		hover: {
			opacity: 1,
			scale: 1,
			transition: { delay: 0.5, type: 'tween' },
		},
	};

	const inserterVariants = {
		start: {
			scale: disableMotion ? 1 : 0,
		},
		rest: {
			scale: 1,
			transition: { delay: 0.4, type: 'tween' },
		},
	};

	if ( isDistractionFree && ! isNavigationMode ) {
		return null;
	}

	// Zoom out mode should only show the insertion point for the insert operation.
	// Other operations such as "group" are when the editor tries to create a row
	// block by grouping the block being dragged with the block it's being dropped
	// onto.
	if ( isZoomOutMode && operation !== 'insert' ) {
		return null;
	}

	const orientationClassname =
		orientation === 'horizontal' || operation === 'group'
			? 'is-horizontal'
			: 'is-vertical';

	const className = clsx(
		'block-editor-block-list__insertion-point',
		orientationClassname
	);

	return (
		<BlockPopoverInbetween
			previousClientId={ previousClientId }
			nextClientId={ nextClientId }
			__unstablePopoverSlot={ __unstablePopoverSlot }
			__unstableContentRef={ __unstableContentRef }
			operation={ operation }
			nearestSide={ nearestSide }
		>
			<motion.div
				layout={ ! disableMotion }
				initial={ disableMotion ? 'rest' : 'start' }
				animate="rest"
				whileHover="hover"
				whileTap="pressed"
				exit="start"
				ref={ ref }
				tabIndex={ -1 }
				onClick={ onClick }
				onFocus={ onFocus }
				className={ clsx( className, {
					'is-with-inserter': isInserterShown,
				} ) }
				onHoverEnd={ maybeHideInserterPoint }
			>
				<motion.div
					variants={ lineVariants }
					className="block-editor-block-list__insertion-point-indicator"
					data-testid="block-list-insertion-point-indicator"
				/>
				{ isInserterShown && (
					<motion.div
						variants={ inserterVariants }
						className={ clsx(
							'block-editor-block-list__insertion-point-inserter'
						) }
					>
						<Inserter
							position="bottom center"
							clientId={ nextClientId }
							rootClientId={ rootClientId }
							__experimentalIsQuick
							onToggle={ ( isOpen ) => {
								openRef.current = isOpen;
							} }
							onSelectOrClose={ () => {
								openRef.current = false;
							} }
						/>
					</motion.div>
				) }
			</motion.div>
		</BlockPopoverInbetween>
	);
}

export default function InsertionPoint( props ) {
	const { insertionCue, isVisible, isBlockListEmpty } = useSelect(
		( select ) => {
			const { getInsertionCue, isInsertionCueVisible, getBlockCount } =
				select( blockEditorStore );
			const blockInsertionCue = getInsertionCue();
			return {
				insertionCue: blockInsertionCue,
				isVisible: isInsertionCueVisible(),
				isBlockListEmpty:
					getBlockCount( blockInsertionCue?.rootClientId ) === 0,
			};
		},
		[]
	);

	if (
		! isVisible ||
		// Don't render the insertion point if the block list is empty.
		// The insertion point will be represented by the appender instead.
		isBlockListEmpty
	) {
		return null;
	}

	/**
	 * Render a popover that overlays the block when the desired operation is to replace it.
	 * Otherwise, render a popover in between blocks for the indication of inserting between them.
	 */
	return insertionCue.operation === 'replace' ? (
		<BlockDropZonePopover
			// Force remount to trigger the animation.
			key={ `${ insertionCue.rootClientId }-${ insertionCue.index }` }
			{ ...props }
		/>
	) : (
		<InbetweenInsertionPointPopover
			operation={ insertionCue.operation }
			nearestSide={ insertionCue.nearestSide }
			{ ...props }
		/>
	);
}
