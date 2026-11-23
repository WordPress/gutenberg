import apiFetch from '@wordpress/api-fetch';
import { Button, PanelBody, RangeControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Stack } from '@wordpress/ui';

/**
 * The size token the sideload endpoint files a picked still frame under.
 */
const LIVE_PHOTO_STILL = 'live_photo_still';

type StillImage = {
	id: number;
	source_url: string;
};

type LivePhotoStillFrameProps = {
	/** URL of the motion companion video. */
	src: string;
	/** URL of the still frame the block currently rests on. */
	poster?: string;
	/** The image attachment the motion belongs to. */
	stillImage: StillImage;
	/** Receives the URL of the newly chosen still frame. */
	onChange: ( poster: string ) => void;
};

/**
 * Waits for a pending seek to land, so the frame drawn is the one shown.
 *
 * @param video The video being seeked.
 */
function whenSeeked( video: HTMLVideoElement ): Promise< void > {
	if ( ! video.seeking ) {
		return Promise.resolve();
	}
	return new Promise( ( resolve ) =>
		video.addEventListener( 'seeked', () => resolve(), { once: true } )
	);
}

/**
 * Captures the frame a video is showing as a JPEG file.
 *
 * @param video Video positioned on the frame to capture.
 * @param name  File name for the capture.
 */
async function captureFrame(
	video: HTMLVideoElement,
	name: string
): Promise< File > {
	await whenSeeked( video );

	const canvas = document.createElement( 'canvas' );
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	canvas.getContext( '2d' )?.drawImage( video, 0, 0 );

	const blob = await new Promise< Blob | null >( ( resolve ) =>
		canvas.toBlob( resolve, 'image/jpeg', 0.9 )
	);
	if ( ! blob ) {
		throw new Error( 'The frame could not be encoded.' );
	}
	return new File( [ blob ], name, { type: 'image/jpeg' } );
}

/**
 * Lets the author pick which frame of a Live photo it rests on, the way a
 * phone lets you choose a Live Photo's key photo.
 *
 * The pick is captured in the browser and stored as a companion file of the
 * same image attachment, so it adds no media library item. It is recorded
 * per block, as the Video block's poster, so one attachment can rest on a
 * different frame wherever it is used. The same frame is shown when the block
 * is displayed as a still image.
 *
 * @param props Component props.
 */
export default function LivePhotoStillFrame( props: LivePhotoStillFrameProps ) {
	const { src, poster, stillImage, onChange } = props;
	const preview = useRef< HTMLVideoElement >( null );
	const [ duration, setDuration ] = useState( 0 );
	const [ position, setPosition ] = useState( 0 );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );

	// Companion files sit next to the image they belong to.
	const directory = stillImage.source_url.slice(
		0,
		stillImage.source_url.lastIndexOf( '/' ) + 1
	);
	const baseName = stillImage.source_url
		.slice( directory.length )
		.replace( /\.[^.]+$/, '' );

	async function saveCurrentFrame() {
		if ( ! preview.current ) {
			return;
		}
		setIsSaving( true );
		try {
			const file = await captureFrame(
				preview.current,
				`${ baseName }-still.jpg`
			);

			const body = new FormData();
			body.append( 'file', file, file.name );
			body.append( 'image_size', LIVE_PHOTO_STILL );
			body.append( 'convert_format', 'false' );

			const subSize = await apiFetch< { file: string } >( {
				path: `/wp/v2/media/${ stillImage.id }/sideload`,
				method: 'POST',
				body,
			} );
			await apiFetch( {
				path: `/wp/v2/media/${ stillImage.id }/finalize`,
				method: 'POST',
				data: { sub_sizes: [ subSize ] },
			} );

			onChange( directory + subSize.file );
		} catch {
			createErrorNotice(
				__( 'The still frame could not be saved. Please try again.' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsSaving( false );
		}
	}

	return (
		<PanelBody title={ __( 'Still frame' ) }>
			<Stack direction="column" gap="md">
				<video
					ref={ preview }
					className="wp-block-video__still-frame-preview"
					src={ src }
					muted
					playsInline
					preload="auto"
					onLoadedMetadata={ ( event ) =>
						setDuration( event.currentTarget.duration || 0 )
					}
				/>
				<RangeControl
					label={ __( 'Frame position' ) }
					help={ __(
						'Choose the moment the photo shows when it is not moving.'
					) }
					value={ position }
					min={ 0 }
					max={ duration }
					step={ 0.01 }
					withInputField={ false }
					renderTooltipContent={ ( value ) =>
						`${ Number( value || 0 ).toFixed( 2 ) }s`
					}
					disabled={ ! duration || isSaving }
					onChange={ ( value ) => {
						const time = value ?? 0;
						setPosition( time );
						if ( preview.current ) {
							preview.current.currentTime = time;
						}
					} }
				/>
				<Stack direction="row" gap="md" justify="flex-start">
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ saveCurrentFrame }
						isBusy={ isSaving }
						disabled={ ! duration || isSaving }
						accessibleWhenDisabled
					>
						{ __( 'Use this frame' ) }
					</Button>
					{ !! poster && poster !== stillImage.source_url && (
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => onChange( stillImage.source_url ) }
							disabled={ isSaving }
							accessibleWhenDisabled
						>
							{ __( 'Reset' ) }
						</Button>
					) }
				</Stack>
			</Stack>
		</PanelBody>
	);
}
