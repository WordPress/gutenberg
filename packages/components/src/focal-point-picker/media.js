/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MediaPlaceholder } from './styles/focal-point-picker-style';
import { isVideoType } from './utils';

export default function Media( {
	alt,
	autoPlay,
	src,
	onLoad = noop,
	mediaRef,
	// Exposing muted prop for test rendering purposes
	// https://github.com/testing-library/react-testing-library/issues/470
	muted = true,
	...props
} ) {
	if ( ! src ) {
		return (
			<MediaPlaceholderElement
				className="components-focal-point-picker__media components-focal-point-picker__media--placeholder"
				onLoad={ onLoad }
				mediaRef={ mediaRef }
			/>
		);
	}

	const isVideo = isVideoType( src );

	return isVideo ? (
		<video
			{ ...props }
			autoPlay={ autoPlay }
			className="components-focal-point-picker__media components-focal-point-picker__media--video"
			loop
			muted={ muted }
			onLoadedData={ onLoad }
			ref={ mediaRef }
			src={ src }
		/>
	) : (
		<img
			{ ...props }
			alt={ alt }
			className="components-focal-point-picker__media components-focal-point-picker__media--image"
			onLoad={ onLoad }
			ref={ mediaRef }
			src={ src }
		/>
	);
}

function MediaPlaceholderElement( { mediaRef, onLoad = noop, ...props } ) {
	const onLoadRef = useRef( onLoad );

	/**
	 * This async callback mimics the onLoad (img) / onLoadedData (video) callback
	 * for media elements. It is used in the main <FocalPointPicker /> component
	 * to calculate the dimensions + boundaries for positioning.
	 */
	useLayoutEffect( () => {
		window.requestAnimationFrame( () => {
			onLoadRef.current();
		} );
	}, [] );

	return <MediaPlaceholder ref={ mediaRef } { ...props } />;
}
