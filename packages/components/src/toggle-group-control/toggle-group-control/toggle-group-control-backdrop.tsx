/**
 * WordPress dependencies
 */
import { useState, useEffect, useLayoutEffect, memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ToggleGroupControlBackdropProps } from '../types';
import { BackdropView } from './styles';
import { COLORS } from '../../utils';

function ToggleGroupControlBackdrop( {
	containerRef,
	containerWidth,
	isAdaptiveWidth,
	state,
}: ToggleGroupControlBackdropProps ) {
	const [ left, setLeft ] = useState< number | undefined >( 0 );
	const [ width, setWidth ] = useState( 0 );
	const [ borderWidth, setBorderWidth ] = useState( 0 );
	const [ targetNode, setTargetNode ] = useState< HTMLElement | null >();

	// On the second transition, the component is in the intended starting position and ready to animate
	const [ transitionCount, setTransitionCount ] = useState( 0 );
	const [ canAnimate, setCanAnimate ] = useState( false );

	useLayoutEffect( () => {
		const containerNode = containerRef?.current;
		if ( ! containerNode ) return;

		// Using querySelector as a workaround for Reakit
		const target = containerNode.querySelector(
			`[data-value="${ state }"]`
		) as HTMLElement;

		// Temporarily set backgrop BG color to button
		if ( ! canAnimate ) {
			target.style.backgroundColor = COLORS.gray[ 900 ];
		}
		setTargetNode( target );
		return () => {
			target.style.backgroundColor = '';
		};
	}, [ containerRef, containerWidth, state, isAdaptiveWidth ] );

	useEffect( () => {
		const containerNode = containerRef?.current;
		if ( ! containerNode || ! targetNode ) return;

		// Set the width of the backdrop to the target (e.g. button) width
		setWidth( targetNode.offsetWidth );

		// Check if there is a border, which is required for positioning
		if ( ! borderWidth ) {
			const bWidth = window
				?.getComputedStyle( containerNode )
				?.getPropertyValue( 'border-width' );
			setBorderWidth( parseInt( bWidth ?? 0, 10 ) );
		}

		const requestAnimationIds: number[] = [];
		const handle = () => {
			// Find and set the offset position for the backdrop
			const { x } = targetNode.getBoundingClientRect();
			const { x: parentX } = containerNode.getBoundingClientRect();
			const offsetLeft = x - parentX - borderWidth;
			const id = window.requestAnimationFrame( () => {
				// If there is no second transition
				if ( offsetLeft === left && ! canAnimate ) {
					setCanAnimate( true );
				}
				setLeft( offsetLeft );
				setTransitionCount( ( count ) => count + 1 );
			} );
			requestAnimationIds.push( id );
		};
		containerNode.addEventListener( 'transitionend', handle );

		return () => {
			containerNode.removeEventListener( 'transitionend', handle );
			requestAnimationIds.forEach( ( id ) =>
				window.cancelAnimationFrame( id )
			);
		};
	}, [ targetNode, width ] );

	useEffect( () => {
		let animationId: number;
		if ( targetNode && transitionCount >= 2 && ! canAnimate ) {
			// Remove temporary background color
			targetNode.style.backgroundColor = '';
			animationId = window.requestAnimationFrame( () => {
				setCanAnimate( true );
			} );
		}
		return () => window.cancelAnimationFrame( animationId );
	}, [ transitionCount ] );

	if ( ! targetNode ) {
		return null;
	}

	return (
		<BackdropView
			role="presentation"
			style={ {
				transform: `translateX(${ left }px)`,
				background: COLORS.gray[ 900 ],
				visibility: canAnimate ? undefined : 'hidden',
				width,
			} }
		/>
	);
}

export default memo( ToggleGroupControlBackdrop );
