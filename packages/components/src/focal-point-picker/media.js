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
	...props
} ) {
	if ( ! src ) {
		return (
			<MediaPlaceholderElement onLoad={ onLoad } mediaRef={ mediaRef } />
		);
	}

	const isVideo = isVideoType( src );

	return isVideo ? (
		<video
			{ ...props }
			autoPlay={ autoPlay }
			loop
			muted
			onLoadedData={ onLoad }
			ref={ mediaRef }
			src={ src }
		/>
	) : (
		<img
			{ ...props }
			alt={ alt }
			onLoad={ onLoad }
			ref={ mediaRef }
			src={ src }
		/>
	);
}

function MediaPlaceholderElement( { mediaRef, onLoad = noop } ) {
	const onLoadRef = useRef( onLoad );

	useLayoutEffect( () => {
		window.requestAnimationFrame( () => {
			onLoadRef.current();
		} );
	}, [] );

	return <MediaPlaceholder ref={ mediaRef } />;
}
