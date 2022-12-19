/**
 * External dependencies
 */
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { MediaPlaceholder } from './styles/focal-point-picker-style';
import { isVideoType } from './utils';
import type { FocalPointPickerMediaProps } from './types';

export default function Media( {
	alt,
	autoPlay,
	src,
	onLoad,
	mediaRef,
	// Exposing muted prop for test rendering purposes
	// https://github.com/testing-library/react-testing-library/issues/470
	muted = true,
	...props
}: FocalPointPickerMediaProps ) {
	if ( ! src ) {
		return (
			<MediaPlaceholder
				className="components-focal-point-picker__media components-focal-point-picker__media--placeholder"
				ref={ mediaRef as Ref< HTMLDivElement > }
				{ ...props }
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
			ref={ mediaRef as Ref< HTMLVideoElement > }
			src={ src }
		/>
	) : (
		<img
			{ ...props }
			alt={ alt }
			className="components-focal-point-picker__media components-focal-point-picker__media--image"
			onLoad={ onLoad }
			ref={ mediaRef as Ref< HTMLImageElement > }
			src={ src }
		/>
	);
}
