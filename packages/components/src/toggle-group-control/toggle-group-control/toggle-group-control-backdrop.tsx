/**
 * WordPress dependencies
 */
import { useState, useEffect, memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ToggleGroupControlBackdropProps } from '../types';
import { BackdropView } from './styles';

function ToggleGroupControlBackdrop( {
	containerRef,
	containerWidth,
	isAdaptiveWidth,
	state,
}: ToggleGroupControlBackdropProps ) {
	// Start at -1 so there is a transition to monitor in case there's no padding
	const [ left, setLeft ] = useState< number | undefined >( -1 );
	const [ width, setWidth ] = useState( 0 );
	const [ borderWidth, setBorderWidth ] = useState( 0 );
	const [ targetNode, setTargetNode ] = useState< HTMLElement | null >();
	// On the second transition, the component is in the intended starting position and ready to animate
	const [ transitionCount, setTransitionCount ] = useState( 0 );
	const [ canAnimate, setReady ] = useState( false );

	useEffect( () => {
		const containerNode = containerRef?.current;
		if ( ! containerNode ) return;

		// Using querySelector as a workaround for Reakit
		const target = containerNode.querySelector(
			`[data-value="${ state }"]`
		) as HTMLElement;
		setTargetNode( target );
	}, [ containerRef, containerWidth, state, isAdaptiveWidth ] );

	useEffect( () => {
		const containerNode = containerRef?.current;
		if ( ! containerNode || ! targetNode ) return;

		// Set the width of the backdrop to the target (e.g. button) width
		setWidth( targetNode.offsetWidth );

		// Check if there is a border, which is required for positioning
		if ( ! borderWidth ) {
			const bWidth = parseInt(
				window
					?.getComputedStyle( containerNode )
					?.getPropertyValue( 'border-width' ) ?? 0,
				10
			);
			setBorderWidth( bWidth );
		}

		const requestAnimationIds: number[] = [];
		const handle = () => {
			// Find and set the offset position for the backdrop
			const { x } = targetNode.getBoundingClientRect();
			const { x: parentX } = containerNode.getBoundingClientRect();
			const offsetLeft = x - parentX - borderWidth;
			const id = window.requestAnimationFrame( () => {
				setLeft( offsetLeft );
				setTransitionCount( ( count ) => count + 1 );
			} );
			requestAnimationIds.push( id );
		};
		containerNode.addEventListener( 'transitionend', handle );

		// Trigger an initial transition for the event listener to pick up on
		if ( left === -1 ) {
			const paddingLeft = parseInt(
				window
					?.getComputedStyle( containerNode )
					?.getPropertyValue( 'padding-left' ) ?? 0,
				10
			);
			setLeft( paddingLeft );
		}

		return () => {
			containerNode.removeEventListener( 'transitionend', handle );
			requestAnimationIds.forEach( ( id ) =>
				window.cancelAnimationFrame( id )
			);
		};
	}, [ targetNode, width ] );

	useEffect( () => {
		if ( transitionCount >= 2 && ! canAnimate ) {
			setReady( true );
		}
	}, [ transitionCount ] );

	if ( ! targetNode ) {
		return null;
	}

	return (
		<BackdropView
			role="presentation"
			style={ {
				transform: `translateX(${ left }px)`,
				visibility: canAnimate ? undefined : 'hidden',
				width,
			} }
		/>
	);
}

export default memo( ToggleGroupControlBackdrop );
