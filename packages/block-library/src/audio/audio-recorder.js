/* global navigator, MediaRecorder */
/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { audio, cancelCircleFilled } from '@wordpress/icons';

const AudioRecorder = ( { onRecordingComplete, onError } ) => {
	const [ isRecording, setIsRecording ] = useState( false );
	const [ mediaRecorder, setMediaRecorder ] = useState( null );
	const [ recordingTime, setRecordingTime ] = useState( 0 );
	const { createErrorNotice } = useDispatch( noticesStore );

	useEffect( () => {
		let interval;
		if ( isRecording ) {
			interval = setInterval( () => {
				setRecordingTime( ( prev ) => prev + 1 );
			}, 1000 );
		}
		return () => clearInterval( interval );
	}, [ isRecording ] );

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia( {
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					sampleRate: 44100,
				},
			} );

			const mimeType = MediaRecorder.isTypeSupported( 'audio/webm' )
				? 'audio/webm'
				: 'audio/mp4';

			const recorder = new MediaRecorder( stream, {
				mimeType,
				audioBitsPerSecond: 128000,
			} );

			const chunks = [];

			recorder.ondataavailable = ( event ) => {
				if ( event.data.size > 0 ) {
					chunks.push( event.data );
				}
			};

			recorder.onstop = () => {
				const blob = new Blob( chunks, { type: mimeType } );
				onRecordingComplete( blob );
				stream.getTracks().forEach( ( track ) => track.stop() );
			};

			recorder.start();
			setMediaRecorder( recorder );
			setIsRecording( true );
			setRecordingTime( 0 );
		} catch ( error ) {
			const message = __(
				'Unable to access microphone. Please check permissions.'
			);
			createErrorNotice( message, { type: 'snackbar' } );
			onError( message );
		}
	};

	const stopRecording = () => {
		if ( mediaRecorder && mediaRecorder.state !== 'inactive' ) {
			mediaRecorder.stop();
			setIsRecording( false );
		}
	};

	const formatTime = ( seconds ) => {
		const minutes = Math.floor( seconds / 60 );
		const remainingSeconds = seconds % 60;
		return `${ minutes }:${ remainingSeconds
			.toString()
			.padStart( 2, '0' ) }`;
	};

	return (
		<div className="wp-block-audio-recorder">
			<div className="wp-block-audio-recorder__controls">
				{ ! isRecording ? (
					<Button
						__next40pxDefaultSize
						icon={ audio }
						variant="secondary"
						onClick={ startRecording }
						className="wp-block-audio-recorder__record-button"
					>
						{ __( 'Record Audio' ) }
					</Button>
				) : (
					<>
						<Button
							__next40pxDefaultSize
							icon={ cancelCircleFilled }
							variant="primary"
							onClick={ stopRecording }
							className="wp-block-audio-recorder__stop-button"
						>
							{ __( 'Stop Recording' ) }
						</Button>
						<span className="wp-block-audio-recorder__timer">
							{ formatTime( recordingTime ) }
						</span>
					</>
				) }
			</div>
		</div>
	);
};

export default AudioRecorder;
