import type { PointerEvent } from 'react';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { rotateRight } from '@wordpress/icons';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { GridItemHandle } from './grid-item-handle';
import { getPointerAngle, getRotationFromPointer } from '../../utils/rotation';
import { setInlineStyle } from './utils';

interface GridItemRotatorProps {
	/** Client ID of the grid item. */
	clientId: string;
	/** Current rotation in degrees. */
	angle: number;
	/** Called with the previewed angle, or null when the preview ends. */
	onPreview?: ( angle: number | null ) => void;
	/** Called with the new angle when the rotation is released. */
	onChange: ( angle: number ) => void;
}

interface Rotation {
	handle: HTMLElement;
	/** The documents listened to for Escape: the canvas and the handle's. */
	documents: Document[];
	pointerId: number;
	centerX: number;
	centerY: number;
	/** The rotation minus the pointer's direction when the drag started. */
	offset: number;
	value: number;
	onKeyDown: ( event: KeyboardEvent ) => void;
}

/**
 * Stops listening for Escape during a rotation.
 *
 * @param rotation The rotation.
 */
function removeKeyListeners( rotation: Rotation ) {
	for ( const ownerDocument of rotation.documents ) {
		ownerDocument.removeEventListener(
			'keydown',
			rotation.onKeyDown,
			true
		);
	}
}

/**
 * A handle for rotating a selected grid item on the canvas, in its toolbar of
 * handles.
 *
 * While dragging, the rotation is previewed with an inline `rotate` style on
 * the block element, which wins over the rotate support's class rules, and
 * nothing is written to the block. Releasing the pointer writes the angle
 * once, so a rotation is a single undo step. Pressing Escape cancels it.
 *
 * Rotation snaps to multiples of 15°. Holding Shift rotates freely.
 */
export function GridItemRotator( {
	clientId,
	angle,
	onPreview,
	onChange,
}: GridItemRotatorProps ) {
	const blockElement = useBlockElement( clientId ) as HTMLElement | null;
	const rotationRef = useRef< Rotation | null >( null );
	const onPreviewRef = useRef( onPreview );
	useEffect( () => {
		onPreviewRef.current = onPreview;
	}, [ onPreview ] );
	const [ previewAngle, setPreviewAngle ] = useState< number | null >( null );

	// Don't leave a preview behind if the handle goes away mid-rotation, for
	// example when the block is deselected.
	useEffect( () => {
		return () => {
			const rotation = rotationRef.current;
			if ( ! rotation ) {
				return;
			}
			rotationRef.current = null;
			removeKeyListeners( rotation );
			if ( blockElement ) {
				setInlineStyle( blockElement, 'rotate', '' );
			}
			onPreviewRef.current?.( null );
		};
	}, [ blockElement ] );

	if ( ! blockElement ) {
		return null;
	}

	function setPreview( nextAngle: number | null ) {
		if ( ! blockElement ) {
			return;
		}
		setInlineStyle(
			blockElement,
			'rotate',
			nextAngle === null ? '' : `${ nextAngle }deg`
		);
		setPreviewAngle( nextAngle );
		onPreview?.( nextAngle );
	}

	function endRotation() {
		const rotation = rotationRef.current;
		if ( ! rotation ) {
			return;
		}
		rotationRef.current = null;
		removeKeyListeners( rotation );
		const { handle, pointerId } = rotation;
		if ( handle.hasPointerCapture( pointerId ) ) {
			handle.releasePointerCapture( pointerId );
		}
	}

	function startRotation( event: PointerEvent< HTMLButtonElement > ) {
		const box = event.currentTarget.closest(
			'.block-editor-grid-item-handles__box'
		);
		if (
			event.button !== 0 ||
			! blockElement ||
			! box ||
			rotationRef.current
		) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		const handle = event.currentTarget;
		// The box turns around its center, so the center of
		// its bounding box is the block's center.
		const rect = box.getBoundingClientRect();
		const onKeyDown = ( keyEvent: KeyboardEvent ) => {
			if ( keyEvent.key === 'Escape' ) {
				// Claim the key, so that the canvas doesn't
				// also move focus away from the block.
				keyEvent.preventDefault();
				endRotation();
				setPreview( null );
			}
		};
		// Focus can be in the canvas or in the editor around
		// it. Listen in the capture phase, so that Escape is
		// handled before anything else in either document.
		const documents = [
			...new Set( [ blockElement.ownerDocument, handle.ownerDocument ] ),
		];
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		rotationRef.current = {
			handle,
			documents,
			pointerId: event.pointerId,
			centerX,
			centerY,
			offset:
				angle -
				getPointerAngle( {
					centerX,
					centerY,
					pointerX: event.clientX,
					pointerY: event.clientY,
				} ),
			value: angle,
			onKeyDown,
		};
		handle.setPointerCapture( event.pointerId );
		for ( const ownerDocument of documents ) {
			ownerDocument.addEventListener( 'keydown', onKeyDown, true );
		}
	}

	return (
		// Keyboard users rotate blocks with the Rotation control in the block
		// settings.
		<GridItemHandle
			className="block-editor-grid-item-handles__rotate"
			label={ __( 'Rotate' ) }
			// While rotating, the handle shows the angle instead.
			icon={ previewAngle === null ? rotateRight : undefined }
			onPointerDown={ startRotation }
			onPointerMove={ ( event ) => {
				// When a pointer is pressed while the browser thinks
				// one of its buttons is already down, the press comes
				// as a move with the button that changed, and not as a
				// `pointerdown`. WebKit does that for the first press
				// after a drag that started outside the canvas, such
				// as from a drag handle.
				if (
					! rotationRef.current &&
					event.button === 0 &&
					event.buttons === 1
				) {
					startRotation( event );
					return;
				}
				const rotation = rotationRef.current;
				if ( ! rotation ) {
					return;
				}
				rotation.value = getRotationFromPointer( {
					centerX: rotation.centerX,
					centerY: rotation.centerY,
					pointerX: event.clientX,
					pointerY: event.clientY,
					offset: rotation.offset,
					snap: ! event.shiftKey,
				} );
				setPreview( rotation.value );
			} }
			onPointerUp={ () => {
				const rotation = rotationRef.current;
				if ( ! rotation ) {
					return;
				}
				endRotation();
				setPreview( null );
				if ( rotation.value !== angle ) {
					onChange( rotation.value );
				}
			} }
			onPointerCancel={ () => {
				if ( ! rotationRef.current ) {
					return;
				}
				endRotation();
				setPreview( null );
			} }
		>
			{ previewAngle !== null && (
				<span className="block-editor-grid-item-handles__angle">
					{ sprintf(
						/* translators: %d: Rotation angle in degrees. */
						__( '%d°' ),
						previewAngle
					) }
				</span>
			) }
		</GridItemHandle>
	);
}
