/**
 * External dependencies
 */
const fs = require( 'fs/promises' );
const os = require( 'os' );
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

function createWavBuffer( { duration = 12, sampleRate = 8000 } = {} ) {
	const channels = 1;
	const bytesPerSample = 2;
	const samples = duration * sampleRate;
	const dataSize = samples * channels * bytesPerSample;
	const buffer = Buffer.alloc( 44 + dataSize );

	buffer.write( 'RIFF', 0 );
	buffer.writeUInt32LE( 36 + dataSize, 4 );
	buffer.write( 'WAVE', 8 );
	buffer.write( 'fmt ', 12 );
	buffer.writeUInt32LE( 16, 16 );
	buffer.writeUInt16LE( 1, 20 );
	buffer.writeUInt16LE( channels, 22 );
	buffer.writeUInt32LE( sampleRate, 24 );
	buffer.writeUInt32LE( sampleRate * channels * bytesPerSample, 28 );
	buffer.writeUInt16LE( channels * bytesPerSample, 32 );
	buffer.writeUInt16LE( bytesPerSample * 8, 34 );
	buffer.write( 'data', 36 );
	buffer.writeUInt32LE( dataSize, 40 );

	return buffer;
}

test.describe( 'Playlist block', () => {
	let audioPath;
	let uploadedMedia;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();

		// Unique per worker process so parallel runs don't collide on the
		// same temp file during upload/cleanup.
		audioPath = path.join(
			os.tmpdir(),
			`playlist-e2e-test-${ process.pid }-${ Date.now() }.wav`
		);
		await fs.writeFile( audioPath, createWavBuffer() );
		uploadedMedia = await requestUtils.uploadMedia( audioPath );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		if ( audioPath ) {
			await fs.rm( audioPath, { force: true } );
		}
	} );

	test( 'waveform seek control can be reached and operated with the keyboard on the frontend', async ( {
		page,
		requestUtils,
	} ) => {
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
			id: uploadedMedia.id,
			uniqueId,
			src: uploadedMedia.source_url,
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

		const seekControl = page.getByRole( 'slider', { name: trackTitle } );
		await expect( seekControl ).toBeVisible();
		await expect( seekControl ).toHaveJSProperty( 'tagName', 'INPUT' );
		await expect( seekControl ).toHaveAttribute( 'type', 'range' );
		await expect
			.poll( async () =>
				Number( await seekControl.getAttribute( 'max' ) )
			)
			.toBeGreaterThan( 0 );

		const waveformContainer = seekControl.locator( '..' );
		await expect( waveformContainer ).not.toHaveAttribute( 'role', /.*/ );
		await expect( waveformContainer ).not.toHaveAttribute(
			'tabindex',
			/.*/
		);
		await expect( waveformContainer.locator( 'canvas' ) ).toHaveAttribute(
			'aria-hidden',
			'true'
		);

		for ( let i = 0; i < 50; i++ ) {
			if (
				await seekControl.evaluate(
					( element ) => element === document.activeElement
				)
			) {
				break;
			}
			await page.keyboard.press( 'Tab' );
		}

		await expect( seekControl ).toBeFocused();
		const currentTime = await page.evaluate(
			() => window.__playlistLastAudioCurrentTime ?? 0
		);

		await page.keyboard.press( 'ArrowRight' );

		await expect
			.poll( () =>
				page.evaluate( () => window.__playlistLastAudioCurrentTime )
			)
			.toBeGreaterThan( currentTime );
	} );
} );
