const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const audioPath = './assets/playlist-e2e-test.wav';
const imagePath = './assets/10x10_e2e_test_image_green.png';
// An audio file WordPress does not accept uploads for, so adding it always
// fails after the track block has optimistically been created.
const rejectedAudioPath = './assets/e2e-test-audio.aiff';

test.describe( 'Playlist block', () => {
	let uploadedAudio;
	let uploadedSecondAudio;
	let uploadedImage;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();

		uploadedAudio = await requestUtils.uploadMedia( audioPath );
		uploadedSecondAudio = await requestUtils.uploadMedia( audioPath );
		uploadedImage = await requestUtils.uploadMedia( imagePath );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'waveform seek control can be reached and operated with the keyboard on the frontend', async ( {
		page,
		requestUtils,
	} ) => {
		// Move page creation to its own Before ALL step?
		await page.addInitScript( () => {
			const descriptor = Object.getOwnPropertyDescriptor(
				HTMLMediaElement.prototype,
				'currentTime'
			);

			Object.defineProperty( HTMLMediaElement.prototype, 'currentTime', {
				configurable: true,
				get() {
					return descriptor.get.call( this );
				},
				set( value ) {
					window.__playlistLastAudioCurrentTime = value;
					descriptor.set.call( this, value );
				},
			} );
		} );

		const uniqueId = 'playlist-keyboard-track';
		const trackTitle = 'Keyboard Test Track';
		const playlistAttributes = { currentTrack: uniqueId };
		const trackAttributes = {
			id: uploadedAudio.id,
			uniqueId,
			src: uploadedAudio.source_url,
			title: trackTitle,
			artist: 'Test Artist',
			length: '0:12',
		};
		const playlistComment = `<!-- wp:playlist ${ JSON.stringify(
			playlistAttributes
		) } -->`;
		const trackComment = `<!-- wp:playlist-track ${ JSON.stringify(
			trackAttributes
		) } /-->`;
		const post = await requestUtils.createPost( {
			title: 'Playlist keyboard seek',
			status: 'publish',
			content: [
				playlistComment,
				'<figure class="wp-block-playlist">',
				'<ol class="wp-block-playlist__tracklist wp-block-playlist__tracklist-show-numbers">',
				trackComment,
				'</ol></figure>',
				'<!-- /wp:playlist -->',
			].join( '' ),
		} );

		await page.goto( post.link );

		// `exact` avoids matching the track button, whose accessible name
		// includes the "Play" or "Pause" screen-reader text.
		const playButton = page.getByRole( 'button', {
			name: 'Play',
			exact: true,
		} );
		const pauseButton = page.getByRole( 'button', {
			name: 'Pause',
			exact: true,
		} );
		const seekControl = page.getByRole( 'slider', { name: trackTitle } );

		// Wait for the player to finish initializing: the seek control gains a
		// real duration once the audio metadata has loaded.
		await expect( playButton ).toBeVisible();
		await expect
			.poll( async () =>
				Number( await seekControl.getAttribute( 'aria-valuemax' ) )
			)
			.toBeGreaterThan( 0 );

		// The server renders the seek value text as a translation template with
		// printf-style placeholders on the player container; the waveform
		// library interpolates the live current time and duration into the
		// slider's aria-valuetext from it.
		await expect(
			page.locator( '.wp-block-playlist__waveform-player' )
		).toHaveAttribute( 'data-label-seek-value', '%1$s of %2$s' );

		// Before playback, the interpolated accessible value reads "0:00 of
		// <duration>" — the placeholders are filled in, not left as "%1$s".
		await expect( seekControl ).toHaveAttribute(
			'aria-valuetext',
			/^0:00 of \d+:\d{2}$/
		);

		// Click Play to start playing. Clicking the button also focuses it.
		await playButton.click();

		// Audio should start playing. expect will allow up to 5000ms for the
		// condition to be met, so we should reach 0:01 within that timeframe
		await expect( seekControl ).toHaveAttribute(
			'aria-valuetext',
			/^0:01 of \d+:\d{2}$/
		);

		// Focus should still be on the play/pause button (now labelled "Pause").
		await expect( pauseButton ).toBeFocused();

		// Press Spacebar to pause the player
		await page.keyboard.press( 'Space' );

		// Audio should stop playing: the accessible name toggles back to "Play".
		await expect( playButton ).toBeVisible();

		// Focus should still be on the play/pause button.
		await expect( playButton ).toBeFocused();

		// Time elapsed should still be 0:01
		await expect( seekControl ).toHaveAttribute(
			'aria-valuetext',
			/^0:01 of \d+:\d{2}$/
		);

		// Press Tab.
		await page.keyboard.press( 'Tab' );

		// Focus should move to the Seek control.
		await expect( seekControl ).toBeVisible();
		await expect( seekControl ).toBeFocused();

		// The interceptor only records seeks, so establish a tracked baseline
		// with a first ArrowRight before measuring the step.
		await page.keyboard.press( 'ArrowRight' );

		// The accessible value text reflects the new position after seeking
		// (interpolated by the library, and no longer at 0:00).
		await expect( seekControl ).toHaveAttribute(
			'aria-valuetext',
			/^0:06 of \d+:\d{2}$/
		);

		// Focus should still be on the slider after seeking.
		await expect( seekControl ).toBeFocused();
	} );

	test( 'removes player artwork when switching to a track without an image on the frontend', async ( {
		page,
		requestUtils,
	} ) => {
		const trackWithImageId = 'playlist-track-with-image';
		const trackWithoutImageId = 'playlist-track-without-image';
		const trackWithoutImageTitle = 'Track without artwork';
		const playlistAttributes = { currentTrack: trackWithImageId };
		const trackWithImageAttributes = {
			id: uploadedAudio.id,
			uniqueId: trackWithImageId,
			src: uploadedAudio.source_url,
			title: 'Track with artwork',
			artist: 'Test Artist',
			image: uploadedImage.source_url,
			imageAlt: 'Green album cover',
			length: '0:12',
		};
		const trackWithoutImageAttributes = {
			id: uploadedSecondAudio.id,
			uniqueId: trackWithoutImageId,
			src: uploadedSecondAudio.source_url,
			title: trackWithoutImageTitle,
			artist: 'Test Artist',
			length: '0:12',
		};
		const playlistComment = `<!-- wp:playlist ${ JSON.stringify(
			playlistAttributes
		) } -->`;
		const firstTrackComment = `<!-- wp:playlist-track ${ JSON.stringify(
			trackWithImageAttributes
		) } /-->`;
		const secondTrackComment = `<!-- wp:playlist-track ${ JSON.stringify(
			trackWithoutImageAttributes
		) } /-->`;
		const post = await requestUtils.createPost( {
			title: 'Playlist artwork removal',
			status: 'publish',
			content: [
				playlistComment,
				'<figure class="wp-block-playlist">',
				'<ol class="wp-block-playlist__tracklist wp-block-playlist__tracklist-show-numbers">',
				firstTrackComment,
				secondTrackComment,
				'</ol></figure>',
				'<!-- /wp:playlist -->',
			].join( '' ),
		} );

		await page.goto( post.link );

		const player = page.locator( '.wp-block-playlist__waveform-player' );
		const playerArtwork = player.locator( '.waveform-artwork' );

		await expect( playerArtwork ).toHaveAttribute(
			'src',
			uploadedImage.source_url
		);
		await expect( playerArtwork ).toHaveAttribute(
			'alt',
			'Green album cover'
		);

		await page
			.getByRole( 'button', { name: /Track without artwork/ } )
			.click();

		await expect(
			player.getByRole( 'slider', { name: trackWithoutImageTitle } )
		).toBeVisible();
		await expect( playerArtwork ).toHaveCount( 0 );
	} );

	test( 'keeps the playlist when the only added track fails to upload', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/playlist' } );

		const playlist = editor.canvas.locator(
			'role=document[name="Block: Playlist"i]'
		);
		await expect( playlist ).toBeVisible();

		const { dragOver, drop } =
			await pageUtils.dragFiles( rejectedAudioPath );
		await dragOver( playlist );
		await drop();

		await expect( page.locator( '.components-snackbar' ) ).toContainText(
			/not allowed to upload this file type/
		);

		// Removing the failed track must not take the playlist with it, which
		// is what removing the last inner block of a container does.
		await expect( playlist ).toBeVisible();
		await expect(
			editor.canvas.locator( '[data-type="core/playlist-track"]' )
		).toHaveCount( 0 );
	} );

	test( 'keeps the existing tracks when an added track fails to upload', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/playlist',
			innerBlocks: [
				{
					name: 'core/playlist-track',
					attributes: {
						id: uploadedAudio.id,
						src: uploadedAudio.source_url,
						title: 'Existing Track',
					},
				},
				// A track the user has added but not filled in yet.
				{ name: 'core/playlist-track' },
			],
		} );

		const playlist = editor.canvas.locator(
			'role=document[name="Block: Playlist"i]'
		);
		const tracks = editor.canvas.locator(
			'[data-type="core/playlist-track"]'
		);
		await expect( playlist ).toBeVisible();
		await expect( tracks ).toHaveCount( 2 );

		const { dragOver, drop } =
			await pageUtils.dragFiles( rejectedAudioPath );
		// Drop on the player, so the file lands on the playlist rather than
		// on the placeholder track's own drop zone.
		await dragOver( playlist, { position: { x: 10, y: 10 } } );
		await drop();

		await expect( page.locator( '.components-snackbar' ) ).toContainText(
			/not allowed to upload this file type/
		);

		// The rejected file adds nothing, and neither the filled track nor
		// the unfilled one is disturbed.
		await expect( tracks ).toHaveCount( 2 );
		await expect(
			editor.canvas.getByRole( 'button', { name: /Existing Track/ } )
		).toBeVisible();
	} );
} );
