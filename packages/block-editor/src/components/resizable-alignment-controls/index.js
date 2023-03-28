/**
 * WordPress dependencies
 */
import {
	ResizableBox,
	__unstableAnimatePresence as AnimatePresence,
	__unstableMotion as motion,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { getScreenRect } from '@wordpress/dom';
import { useMemo, useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockAlignmentVisualizer from '../block-alignment-visualizer';
import {
	BlockAlignmentGuideContextProvider,
	useDetectSnapping,
} from '../block-alignment-visualizer/guide-context';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function getVisibleHandles( alignment ) {
	if ( alignment === 'center' ) {
		// When the image is centered, show both handles.
		return { right: true, left: true, bottom: true, top: false };
	}

	if ( isRTL() ) {
		// In RTL mode the image is on the right by default.
		// Show the right handle and hide the left handle only when it is
		// aligned left. Otherwise always show the left handle.
		if ( alignment === 'left' ) {
			return { right: true, left: false, bottom: true, top: false };
		}
		return { left: true, right: false, bottom: true, top: false };
	}

	// Show the left handle and hide the right handle only when the
	// image is aligned right. Otherwise always show the right handle.
	if ( alignment === 'right' ) {
		return { left: true, right: false, bottom: true, top: false };
	}
	return { right: true, left: false, bottom: true, top: false };
}

/**
 * A component that composes `ResizableBox` and `BlockAlignmentVisualizer`
 * and configures snapping to block alignments.
 *
 * @param {Object}                       props
 * @param {?string[]}                    props.allowedAlignments An optional array of allowed alignments. If not provided this will be inferred from the block supports.
 * @param {import('react').ReactElement} props.children          Children of the ResizableBox.
 * @param {string}                       props.clientId          The clientId of the block
 * @param {?string}                      props.currentAlignment  The current alignment name. Defaults to 'none'.
 * @param {number}                       props.minWidth          Minimum width of the resizable box.
 * @param {number}                       props.maxWidth          Maximum width of the resizable box.
 * @param {number}                       props.minHeight         Minimum height of the resizable box.
 * @param {number}                       props.maxHeight         Maximum height of the resizable box.
 * @param {Function}                     props.onResizeStart     An event handler called when resizing starts.
 * @param {Function}                     props.onResizeStop      An event handler called when resizing stops.
 * @param {Function}                     props.onSnap            Function called when alignment is set.
 * @param {boolean}                      props.showHandle        Whether to show the drag handle.
 * @param {Object}                       props.size              The current dimensions.
 */
function ResizableAlignmentControls( {
	allowedAlignments,
	children,
	clientId,
	currentAlignment = 'none',
	minWidth,
	maxWidth,
	minHeight,
	maxHeight,
	onResizeStart,
	onResizeStop,
	onSnap,
	showHandle,
	size,
} ) {
	const resizableRef = useRef();
	const aspect = useRef( size.height / size.width );
	const detectSnapping = useDetectSnapping();
	const [ isAlignmentVisualizerVisible, setIsAlignmentVisualizerVisible ] =
		useState( false );
	const [ snappedAlignment, setSnappedAlignment ] = useState( null );
	const { hideBlockInterface, showBlockInterface } = unlock(
		useDispatch( blockEditorStore )
	);

	const rootClientId = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockRootClientId( clientId ),
		[ clientId ]
	);

	// Compute the styles of the content when snapped or unsnapped.
	const contentStyle = useMemo( () => {
		if ( ! snappedAlignment ) {
			// By default the content takes up the full width of the resizable box.
			return { width: '100%' };
		}

		// Calculate the positioning of the snapped image.
		const resizableRect = getScreenRect( resizableRef.current );
		const alignmentRect = snappedAlignment.rect;
		return {
			position: 'absolute',
			left: alignmentRect.left - resizableRect.left,
			top: alignmentRect.top - resizableRect.top,
			width: alignmentRect.width,
		};
	}, [ snappedAlignment ] );

	// Because the `contentStyle` is absolutely positioned when snapping occurs
	// the block won't have the correct height. A separate div is used to provide
	// the correct height, calculated here.
	const heightStyle = useMemo( () => {
		if ( ! snappedAlignment ) {
			// This is a bit hacky, but using `float: left` ensures the element
			// isn't part of the layout but still gives a height to the
			// container.
			return { float: 'left', height: 'inherit' };
		}

		const alignmentRect = snappedAlignment.rect;

		return {
			float: 'left',
			height: alignmentRect.width * aspect.current,
		};
	}, [ snappedAlignment ] );

	return (
		<>
			<AnimatePresence>
				{ isAlignmentVisualizerVisible && (
					<motion.div
						initial={ { opacity: 0 } }
						animate={ { opacity: 1 } }
						exit={ { opacity: 0 } }
						transition={ { duration: 0.15 } }
					>
						<BlockAlignmentVisualizer
							layoutClientId={ rootClientId }
							focusedClientId={ clientId }
							allowedAlignments={ allowedAlignments }
							highlightedAlignment={ snappedAlignment?.name }
						/>
					</motion.div>
				) }
			</AnimatePresence>
			<ResizableBox
				size={ size }
				showHandle={ showHandle }
				minWidth={ minWidth }
				maxWidth={ maxWidth }
				minHeight={ minHeight }
				maxHeight={ maxHeight }
				lockAspectRatio
				enable={ getVisibleHandles( currentAlignment ) }
				onResizeStart={ ( ...resizeArgs ) => {
					onResizeStart( ...resizeArgs );
					const [ , resizeDirection, resizeElement ] = resizeArgs;

					// The 'ref' prop on the `ResizableBox` component is used to expose the re-resizable API.
					// This seems to be the only way to get a ref to the element.
					resizableRef.current = resizeElement;
					hideBlockInterface();

					if (
						resizeDirection === 'right' ||
						resizeDirection === 'left'
					) {
						setIsAlignmentVisualizerVisible( true );
					}
				} }
				onResize={ ( event, resizeDirection, resizableElement ) => {
					// Detect if snapping is happening.
					const newSnappedAlignment = detectSnapping(
						resizableElement,
						resizeDirection
					);
					if (
						newSnappedAlignment?.name !== snappedAlignment?.name
					) {
						setSnappedAlignment( newSnappedAlignment );
					}
				} }
				onResizeStop={ ( ...resizeArgs ) => {
					if ( onSnap && snappedAlignment ) {
						onSnap( snappedAlignment?.name );
					} else {
						onResizeStop( ...resizeArgs );
					}
					setIsAlignmentVisualizerVisible( false );
					showBlockInterface();
					setSnappedAlignment( null );
				} }
				resizeRatio={ currentAlignment === 'center' ? 2 : 1 }
			>
				<motion.div
					layout
					style={ heightStyle }
					transition={ { duration: 0.2 } }
				/>
				<motion.div
					layout
					style={ contentStyle }
					transition={ { duration: 0.2 } }
				>
					{ children }
				</motion.div>
			</ResizableBox>
		</>
	);
}

export default function ResizableAlignmentControlsWithZoneContext( {
	...props
} ) {
	return (
		<BlockAlignmentGuideContextProvider>
			<ResizableAlignmentControls { ...props } />
		</BlockAlignmentGuideContextProvider>
	);
}
