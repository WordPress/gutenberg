/**
 * A step after `core/upload` for videos: grabs the first frame in the
 * browser and sends it to the plugin's own endpoint as the video's poster.
 *
 * Three parts of the upload operation API meet here. The plan reacts to
 * the file type and places the step after the upload; the handler reads
 * `item.attachment.id`, which only exists because the upload step ran
 * before it; and the step joins a pool of its own, so two videos never
 * decode at once.
 *
 * The poster does not go through `context.addSideloadItem()`: the sideload
 * endpoint accepts only the companion files core defines, so a companion
 * of a plugin's own goes to an endpoint the plugin provides.
 */
( function () {
	const { registerUploadConcurrencyPool, registerUploadOperation } =
		wp.uploadMedia;
	const { __ } = wp.i18n;

	const POOL = 'gutenberg-test/video-poster';

	/**
	 * Draws the first frame the browser renders of a video.
	 *
	 * Plays the video rather than seeking: a file straight out of a
	 * recorder may have no index to seek by, but it always has a first
	 * frame to render.
	 *
	 * @param {File}        file   Video file.
	 * @param {AbortSignal} signal Aborted when the upload is cancelled.
	 * @return {Promise<Blob>} The frame as a JPEG.
	 */
	async function grabFirstFrame( file, signal ) {
		const url = URL.createObjectURL( file );
		const video = document.createElement( 'video' );
		video.muted = true;
		video.playsInline = true;
		video.preload = 'auto';
		video.src = url;

		try {
			await video.play();
			await new Promise( ( resolve, reject ) => {
				signal?.addEventListener( 'abort', () =>
					reject( signal.reason )
				);
				video.requestVideoFrameCallback( () => resolve() );
			} );
			video.pause();

			const canvas = new OffscreenCanvas(
				video.videoWidth,
				video.videoHeight
			);
			canvas.getContext( '2d' ).drawImage( video, 0, 0 );
			return await canvas.convertToBlob( {
				type: 'image/jpeg',
				quality: 0.82,
			} );
		} finally {
			video.removeAttribute( 'src' );
			video.load();
			URL.revokeObjectURL( url );
		}
	}

	registerUploadConcurrencyPool( POOL, { limit: 1 } );

	registerUploadOperation( 'gutenberg-test/video-poster', {
		label: __( 'Grabbing a poster frame' ),
		concurrency: POOL,

		plan( item ) {
			if ( ! item.file.type.startsWith( 'video/' ) ) {
				return;
			}
			return { after: 'core/upload' };
		},

		async handler( item, _args, { signal } ) {
			// The upload step ran before this one, so the item carries the
			// attachment it created.
			const attachmentId = item.attachment?.id;
			if ( ! attachmentId ) {
				return;
			}

			const poster = await grabFirstFrame( item.file, signal );
			const body = new FormData();
			body.append(
				'poster',
				poster,
				item.file.name.replace( /\.[^.]+$/, '' ) + '-poster.jpg'
			);

			await wp.apiFetch( {
				path: `/gutenberg-test/v1/video-poster/${ attachmentId }`,
				method: 'POST',
				body,
				signal,
			} );
		},
	} );
} )();
