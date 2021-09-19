/**
 * WordPress dependencies
 */
import { useState, useEffect, memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ToggleGroupControlBackdropProps } from './types';
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

	useEffect( () => {
		const containerNode = containerRef?.current;
		if ( ! containerNode ) return;

		/**
		 * Workaround for Reakit
		 */
		const targetNode = containerNode.querySelector(
			'[data-active="true"]'
		) as HTMLElement;
		if ( ! targetNode ) return;

		setLeft( targetNode.offsetLeft );
		setWidth( targetNode.offsetWidth );

		let requestId: number;
		if ( ! canAnimate ) {
			requestId = window.requestAnimationFrame( () => {
				setCanAnimate( true );
			} );
		}
		return () => window.cancelAnimationFrame( requestId );
	}, [ canAnimate, containerRef, containerWidth, state, isAdaptiveWidth ] );

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
