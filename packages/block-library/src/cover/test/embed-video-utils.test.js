import { describe, expect, it } from 'vitest';
import {
	getBackgroundEmbedHtml,
	getBackgroundVideoSrc,
} from '../embed-video-utils';

const YOUTUBE_SRC = 'https://www.youtube.com/embed/abc123?feature=oembed';
const VIMEO_SRC = 'https://player.vimeo.com/video/123456';

describe( 'getBackgroundVideoSrc', () => {
	it( 'adds autoplay by default', () => {
		const url = new URL( getBackgroundVideoSrc( YOUTUBE_SRC ) );

		expect( url.searchParams.get( 'autoplay' ) ).toBe( '1' );
		expect( url.searchParams.get( 'loop' ) ).toBe( '1' );
	} );

	it( 'leaves out autoplay when autoplay is disabled', () => {
		const url = new URL(
			getBackgroundVideoSrc( YOUTUBE_SRC, { autoplay: false } )
		);

		expect( url.searchParams.has( 'autoplay' ) ).toBe( false );
		expect( url.searchParams.get( 'loop' ) ).toBe( '1' );
	} );

	it( 'uses Vimeo background mode only when autoplay is enabled', () => {
		const autoplayUrl = new URL( getBackgroundVideoSrc( VIMEO_SRC ) );
		const pausedUrl = new URL(
			getBackgroundVideoSrc( VIMEO_SRC, { autoplay: false } )
		);

		expect( autoplayUrl.searchParams.get( 'background' ) ).toBe( '1' );
		expect( pausedUrl.searchParams.has( 'background' ) ).toBe( false );
		expect( pausedUrl.searchParams.has( 'autoplay' ) ).toBe( false );
	} );
} );

describe( 'getBackgroundEmbedHtml', () => {
	it( 'passes the autoplay option through to the iframe src', () => {
		const html = `<iframe src="${ YOUTUBE_SRC }"></iframe>`;

		expect( getBackgroundEmbedHtml( html ) ).toContain( 'autoplay=1' );
		expect(
			getBackgroundEmbedHtml( html, { autoplay: false } )
		).not.toContain( 'autoplay' );
	} );
} );
