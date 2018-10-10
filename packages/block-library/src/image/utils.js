/**
 * WordPress dependencies
 */
import { withGlobalEvents } from '@wordpress/compose';

export function fetchImageSize( src, onload, callback ) {
	const image = new window.Image();
	image.onload = onload;
	image.src = src;
	callback( image );
}

export function renderContainer( bindContainer, sizes, children, onLayoutCallback ) {
	onLayoutCallback(); // silence unused lint error
	return (
		<div ref={ bindContainer }>
			{ children( sizes ) }
		</div>
	);
}

export function onLayout() {
}

export function exporter( component ) {
	return withGlobalEvents( {
		resize: 'calculateSize',
	} )( component );
}
