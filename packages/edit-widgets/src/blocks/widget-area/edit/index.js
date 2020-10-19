/**
 * External dependencies
 */
import { DisclosureContent } from 'reakit/Disclosure';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useCallback, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { EntityProvider } from '@wordpress/core-data';
import { Panel, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import WidgetAreaInnerBlocks from './inner-blocks';

export default function WidgetAreaEdit( {
	clientId,
	className,
	attributes: { id, name },
} ) {
	const isOpen = useSelect(
		( select ) =>
			select( 'core/edit-widgets' ).getIsWidgetAreaOpen( clientId ),
		[ clientId ]
	);
	const { setIsWidgetAreaOpen } = useDispatch( 'core/edit-widgets' );

	const wrapper = useRef();
	const setOpen = useCallback(
		( openState ) => setIsWidgetAreaOpen( clientId, openState ),
		[ clientId ]
	);
	const isDragging = useIsDragging();
	const isDraggingWithin = useIsDraggingWithin( wrapper );

	const [ openedWhileDragging, setOpenedWhileDragging ] = useState( false );
	useEffect( () => {
		if ( ! isDragging ) {
			setOpenedWhileDragging( false );
			return;
		}

		if ( isDraggingWithin && ! isOpen ) {
			setOpen( true );
			setOpenedWhileDragging( true );
		} else if ( ! isDraggingWithin && isOpen && openedWhileDragging ) {
			setOpen( false );
		}
	}, [ isOpen, isDragging, isDraggingWithin, openedWhileDragging ] );

	return (
		<Panel className={ className } ref={ wrapper }>
			<PanelBody
				title={ name }
				opened={ isOpen }
				onToggle={ () => {
					setIsWidgetAreaOpen( clientId, ! isOpen );
				} }
				scrollAfterOpen={ ! isDragging }
			>
				{ ( { opened } ) => (
					// This is required to ensure LegacyWidget blocks are not unmounted when the panel is collapsed.
					// Unmounting legacy widgets may have unintended consequences (e.g. TinyMCE not being properly reinitialized)
					<DisclosureContent visible={ opened }>
						<EntityProvider
							kind="root"
							type="postType"
							id={ `widget-area-${ id }` }
						>
							<WidgetAreaInnerBlocks />
						</EntityProvider>
					</DisclosureContent>
				) }
			</PanelBody>
		</Panel>
	);
}

/**
 * A React hook to determine if dragging is active.
 *
 * @typedef {import('@wordpress/element').RefObject} RefObject
 *
 * @return {boolean} Is dragging within the entire document.
 */
const useIsDragging = () => {
	const [ isDragging, setIsDragging ] = useState( false );

	useEffect( () => {
		function handleDragStart() {
			setIsDragging( true );
		}

		function handleDragEnd() {
			setIsDragging( false );
		}

		document.addEventListener( 'dragstart', handleDragStart );
		document.addEventListener( 'dragend', handleDragEnd );

		return () => {
			document.removeEventListener( 'dragstart', handleDragStart );
			document.removeEventListener( 'dragend', handleDragEnd );
		};
	}, [] );

	return isDragging;
};

/**
 * A React hook to determine if it's dragging within the target element.
 *
 * @typedef {import('@wordpress/element').RefObject} RefObject
 *
 * @param {RefObject<HTMLElement>} elementRef The target elementRef object.
 *
 * @return {boolean} Is dragging within the target element.
 */
const useIsDraggingWithin = ( elementRef ) => {
	const [ isDraggingWithin, setIsDraggingWithin ] = useState( false );

	useEffect( () => {
		function handleDragStart( event ) {
			// Check the first time when the dragging starts.
			handleDragEnter( event );
		}

		// Set to false whenever the user cancel the drag event by either releasing the mouse or press Escape.
		function handleDragEnd() {
			setIsDraggingWithin( false );
		}

		function handleDragEnter( event ) {
			// Check if the current target is inside the item element.
			if ( elementRef.current.contains( event.target ) ) {
				setIsDraggingWithin( true );
			} else {
				setIsDraggingWithin( false );
			}
		}

		// Bind these events to the document to catch all drag events.
		// Ideally, we can also use `event.relatedTarget`, but sadly that doesn't work in Safari.
		document.addEventListener( 'dragstart', handleDragStart );
		document.addEventListener( 'dragend', handleDragEnd );
		document.addEventListener( 'dragenter', handleDragEnter );

		return () => {
			document.removeEventListener( 'dragstart', handleDragStart );
			document.removeEventListener( 'dragend', handleDragEnd );
			document.removeEventListener( 'dragenter', handleDragEnter );
		};
	}, [] );

	return isDraggingWithin;
};
