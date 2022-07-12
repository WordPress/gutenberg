/**
 * Internal dependencies
 */
import { MediaPlaceholder } from './styles/focal-point-picker-style';
import { isVideoType } from './utils';

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
} ) {
	if ( ! src ) {
		return (
			<MediaPlaceholder
				className="components-focal-point-picker__media components-focal-point-picker__media--placeholder"
				ref={ mediaRef }
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
