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
	const [ left, setLeft ] = useState( 0 );
	const [ width, setWidth ] = useState( 0 );
	const [ canAnimate, setCanAnimate ] = useState( false );
	const [ renderBackdrop, setRenderBackdrop ] = useState( false );

	useEffect( () => {
		const containerNode = containerRef?.current;
		if ( ! containerNode ) return;

		/**
		 * Workaround for Reakit
		 */
		const targetNode = containerNode.querySelector(
			`[data-value="${ state }"]`
		);
		setRenderBackdrop( !! targetNode );
		if ( ! targetNode ) {
			return;
		}

		const computeDimensions = () => {
			const {
				width: offsetWidth,
				x,
			} = targetNode.getBoundingClientRect();

			const { x: parentX } = containerNode.getBoundingClientRect();

			const borderWidth = 1;
			const offsetLeft = x - parentX - borderWidth;

			setLeft( offsetLeft );
			setWidth( offsetWidth );
		};
		// Fix to make the component appear as expected inside popovers.
		// If the targetNode width is 0 it means the element was not yet rendered we should allow
		// some time for the render to happen.
		// requestAnimationFrame instead of setTimeout with a small time does not seems to work.
		const dimensionsRequestId = window.setTimeout( computeDimensions, 100 );

		let animationRequestId: number;
		if ( ! canAnimate ) {
			animationRequestId = window.requestAnimationFrame( () => {
				setCanAnimate( true );
			} );
		}
		return () => {
			window.clearTimeout( dimensionsRequestId );
			window.cancelAnimationFrame( animationRequestId );
		};
	}, [ canAnimate, containerRef, containerWidth, state, isAdaptiveWidth ] );

	if ( ! renderBackdrop ) {
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
