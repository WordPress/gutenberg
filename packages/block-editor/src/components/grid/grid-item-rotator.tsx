import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { rotateRight, Icon } from '@wordpress/icons';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getRotationFromPointer } from './rotation';
import { useRotatedOverlayStyle } from './use-rotated-overlay-style';
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
	pointerId: number;
	centerX: number;
	centerY: number;
	value: number;
	onKeyDown: ( event: KeyboardEvent ) => void;
}

/**
 * A handle below a selected grid item for rotating it on the canvas.
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
	const boxRef = useRef< HTMLDivElement >( null );
	const rotationRef = useRef< Rotation | null >( null );
	const onPreviewRef = useRef( onPreview );
	useEffect( () => {
		onPreviewRef.current = onPreview;
	}, [ onPreview ] );
	const [ previewAngle, setPreviewAngle ] = useState< number | null >( null );
	const overlayStyle = useRotatedOverlayStyle(
		blockElement,
		previewAngle ?? angle
	);

	// Don't leave a preview behind if the handle goes away mid-rotation, for
	// example when the block is deselected.
	useEffect( () => {
		return () => {
			const rotation = rotationRef.current;
			if ( ! rotation ) {
				return;
			}
			rotationRef.current = null;
			rotation.handle.ownerDocument.removeEventListener(
				'keydown',
				rotation.onKeyDown
			);
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
		const { handle, pointerId, onKeyDown } = rotation;
		handle.ownerDocument.removeEventListener( 'keydown', onKeyDown );
		if ( handle.hasPointerCapture( pointerId ) ) {
			handle.releasePointerCapture( pointerId );
		}
	}

	return (
		<BlockPopoverCover
			className="block-editor-grid-item-handles"
			clientId={ clientId }
			__unstablePopoverSlot="__unstable-block-tools-after"
			additionalStyles={ overlayStyle }
		>
			<div ref={ boxRef } className="block-editor-grid-item-handles__box">
				<div
					className="block-editor-grid-item-handles__rotate"
					title={ __( 'Rotate' ) }
					// The handle only works with a pointer. Keyboard users
					// rotate blocks with the Rotation control in the block
					// settings.
					aria-hidden="true"
					onPointerDown={ ( event ) => {
						if (
							event.button !== 0 ||
							! boxRef.current ||
							rotationRef.current
						) {
							return;
						}
						event.preventDefault();
						event.stopPropagation();
						const handle = event.currentTarget;
						// The box turns around its center, so the center of
						// its bounding box is the block's center.
						const rect = boxRef.current.getBoundingClientRect();
						const onKeyDown = ( keyEvent: KeyboardEvent ) => {
							if ( keyEvent.key === 'Escape' ) {
								keyEvent.preventDefault();
								keyEvent.stopPropagation();
								endRotation();
								setPreview( null );
							}
						};
						rotationRef.current = {
							handle,
							pointerId: event.pointerId,
							centerX: rect.left + rect.width / 2,
							centerY: rect.top + rect.height / 2,
							value: angle,
							onKeyDown,
						};
						handle.setPointerCapture( event.pointerId );
						handle.ownerDocument.addEventListener(
							'keydown',
							onKeyDown
						);
					} }
					onPointerMove={ ( event ) => {
						const rotation = rotationRef.current;
						if ( ! rotation ) {
							return;
						}
						rotation.value = getRotationFromPointer( {
							centerX: rotation.centerX,
							centerY: rotation.centerY,
							pointerX: event.clientX,
							pointerY: event.clientY,
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
					<Icon icon={ rotateRight } size={ 16 } />
				</div>
				{ previewAngle !== null && (
					<span
						className="block-editor-grid-item-handles__angle"
						// Counter the overlay's rotation so the text stays upright.
						style={ { rotate: `${ -previewAngle }deg` } }
					>
						{ sprintf(
							/* translators: %d: Rotation angle in degrees. */
							__( '%d°' ),
							previewAngle
						) }
					</span>
				) }
			</div>
		</BlockPopoverCover>
	);
}
