/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { createContext, useContext } from '@wordpress/element';
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
	const openRef = useContext( InsertionPointOpenRef );
	const {
		orientation,
		previousClientId,
		nextClientId,
		rootClientId,
		isInserterShown,
		isDistractionFree,
		isZoomOutMode,
	} = useSelect( ( select ) => {
		const {
			getBlockOrder,
			getBlockListSettings,
			getBlockInsertionPoint,
			isBlockBeingDragged,
			getPreviousBlockClientId,
			getNextBlockClientId,
			getSettings,
			__unstableGetEditorMode,
		} = select( blockEditorStore );
		const insertionPoint = getBlockInsertionPoint();
		const order = getBlockOrder( insertionPoint.rootClientId );

		if ( ! order.length ) {
			return {};
		}

		let _previousClientId = order[ insertionPoint.index - 1 ];
		let _nextClientId = order[ insertionPoint.index ];

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
				getBlockListSettings( insertionPoint.rootClientId )
					?.orientation || 'vertical',
			rootClientId: insertionPoint.rootClientId,
			isDistractionFree: settings.isDistractionFree,
			isInserterShown: insertionPoint?.__unstableWithInserter,
			isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
		};
	}, [] );

	const disableMotion = useReducedMotion();

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

	if ( isDistractionFree ) {
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
				className={ className }
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
	const { insertionPoint, isVisible, isBlockListEmpty } = useSelect(
		( select ) => {
			const {
				getBlockInsertionPoint,
				isBlockInsertionPointVisible,
				getBlockCount,
			} = select( blockEditorStore );
			const blockInsertionPoint = getBlockInsertionPoint();
			return {
				insertionPoint: blockInsertionPoint,
				isVisible: isBlockInsertionPointVisible(),
				isBlockListEmpty:
					getBlockCount( blockInsertionPoint?.rootClientId ) === 0,
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
	return insertionPoint.operation === 'replace' ? (
		<BlockDropZonePopover
			// Force remount to trigger the animation.
			key={ `${ insertionPoint.rootClientId }-${ insertionPoint.index }` }
			{ ...props }
		/>
	) : (
		<InbetweenInsertionPointPopover
			operation={ insertionPoint.operation }
			nearestSide={ insertionPoint.nearestSide }
			{ ...props }
		/>
	);
}
