/**
 * Internal dependencies
 */
import {
	getSafeStandaloneIframeProps,
	isSafeStandaloneIframeMarkup,
} from '../preview-utils';

describe( 'core/html preview utils', () => {
	describe( 'isSafeStandaloneIframeMarkup()', () => {
		it( 'returns true for a standalone https iframe embed', () => {
			expect(
				isSafeStandaloneIframeMarkup(
					'<iframe src="https://iframe.dacast.com/vod/example" width="100%" height="100%" frameborder="0"></iframe>'
				)
			).toBe( true );
		} );

		it( 'returns true for a standalone protocol-relative iframe embed', () => {
			expect(
				isSafeStandaloneIframeMarkup(
					'<iframe src="//iframe.dacast.com/vod/example"></iframe>'
				)
			).toBe( true );
		} );

		it( 'returns false for iframe markup with extra elements', () => {
			expect(
				isSafeStandaloneIframeMarkup(
					'<div><iframe src="https://iframe.dacast.com/vod/example"></iframe></div>'
				)
			).toBe( false );
		} );

		it( 'returns false when scripts are present in markup', () => {
			expect(
				isSafeStandaloneIframeMarkup(
					'<iframe src="https://iframe.dacast.com/vod/example"></iframe><script>alert(1)</script>'
				)
			).toBe( false );
		} );

		it( 'returns false for iframe srcdoc usage', () => {
			expect(
				isSafeStandaloneIframeMarkup(
					'<iframe srcdoc="<script>alert(1)</script>"></iframe>'
				)
			).toBe( false );
		} );

		it( 'returns false for non-network iframe src schemes', () => {
			expect(
				isSafeStandaloneIframeMarkup(
					'<iframe src="javascript:alert(1)"></iframe>'
				)
			).toBe( false );
			expect(
				isSafeStandaloneIframeMarkup(
					'<iframe src="data:text/html,<h1>x</h1>"></iframe>'
				)
			).toBe( false );
		} );
	} );

	describe( 'getSafeStandaloneIframeProps()', () => {
		it( 'returns iframe props for safe standalone iframe markup', () => {
			expect(
				getSafeStandaloneIframeProps(
					'<iframe src="https://iframe.dacast.com/vod/example" allow="autoplay;encrypted-media" allowfullscreen frameborder="0" scrolling="no"></iframe>'
				)
			).toEqual( {
				src: 'https://iframe.dacast.com/vod/example',
				allow: 'autoplay;encrypted-media',
				title: undefined,
				loading: undefined,
				referrerPolicy: undefined,
				frameBorder: '0',
				scrolling: 'no',
				allowFullScreen: true,
			} );
		} );

		it( 'returns null for unsafe iframe attributes', () => {
			expect(
				getSafeStandaloneIframeProps(
					'<iframe src="https://iframe.dacast.com/vod/example" onload="alert(1)"></iframe>'
				)
			).toBeNull();
		} );
	} );
} );
