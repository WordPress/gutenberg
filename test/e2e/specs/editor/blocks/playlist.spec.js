/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const audioPath = path.join(
	__dirname,
	'../../../assets/playlist-e2e-test.wav'
);

test.describe( 'Playlist block', () => {
	let uploadedMedia;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();

		uploadedMedia = await requestUtils.uploadMedia( audioPath );
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
