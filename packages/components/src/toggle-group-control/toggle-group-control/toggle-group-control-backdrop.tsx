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
	const [ left, setLeft ] = useState< number | undefined >( undefined );
	const [ width, setWidth ] = useState( 0 );
	const [ canAnimate, setCanAnimate ] = useState( false );
	const [ targetNode, setTargetNode ] = useState< HTMLElement >();

	useEffect( () => {
		const containerNode = containerRef?.current;
		if ( ! containerNode ) return;
		const target = containerNode.querySelector(
			`[data-value="${ state }"]`
		) as HTMLElement;
		setTargetNode( target );
	}, [ containerRef, containerWidth, state, isAdaptiveWidth ] );

	useEffect( () => {
		if ( ! containerRef?.current || ! targetNode ) return;
		// Set the width when the target node changes
		setWidth( targetNode.offsetWidth );
	}, [ targetNode ] );

	useEffect( () => {
		const containerNode = containerRef?.current;
		if ( ! containerNode || ! targetNode ) return;

		// If the component is being rendered in an animating parent (i.e. popover),
		// the element's final x/y position may not be available until the parent
		// finishes animating. We poll until then and wait for an available frame thereafter
		let timer = 0;
		const pollTime = 5;
		const maxPollTime = 150;
		let animationRequestId: number;
		const waitForTransition = window.setInterval( () => {
			timer += pollTime;

			// Check whether the element is in a subpixel position, likely in transition
			const { x, y, width: targetW } = targetNode.getBoundingClientRect();
			const inMotion = x % 1 !== 0 || y % 1 !== 0;
			if ( ( targetW && ! inMotion ) || timer >= maxPollTime ) {
				const { x: parentX } = containerNode.getBoundingClientRect();
				const borderWidth = 1;
				const offsetLeft = x - parentX - borderWidth;
				animationRequestId = window.requestAnimationFrame( () => {
					setLeft( offsetLeft );
				} );
				window.clearInterval( waitForTransition );
			}
		}, pollTime );

		return () => {
			window.cancelAnimationFrame( animationRequestId );
			window.clearInterval( waitForTransition );
		};
	}, [ targetNode, width ] );

	useEffect( () => {
		// Don't animate until the position is set
		if ( ! canAnimate && left !== undefined ) {
			setCanAnimate( true );
		}
	}, [ left ] );

	// Do not render unless we have a target node and it's position is known
	if ( ! targetNode || left === undefined ) {
		return null;
	}

	return (
		<BackdropView
			role="presentation"
			style={ {
				transform: `translateX(${ left }px)`,
				transition: canAnimate ? undefined : 'none',
				width,
			} }
		/>
	);
}

export default memo( ToggleGroupControlBackdrop );
