/**
 * Internal dependencies
 */
import { getDefaultLinkDestination, getHrefAndDestination } from '../utils';
import {
	LINK_DESTINATION_LIGHTBOX,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
} from '../constants';

describe( 'gallery block utils', () => {
	describe( 'getDefaultLinkDestination', () => {
		const originalGalleryLightboxDefault =
			window.__experimentalGalleryLightboxDefault;

		afterEach( () => {
			if ( originalGalleryLightboxDefault === undefined ) {
				delete window.__experimentalGalleryLightboxDefault;
				return;
			}

			window.__experimentalGalleryLightboxDefault =
				originalGalleryLightboxDefault;
		} );

		it( 'uses the media default link destination when the experiment is disabled', () => {
			window.__experimentalGalleryLightboxDefault = false;

			expect(
				getDefaultLinkDestination( LINK_DESTINATION_MEDIA, {
					allowEditing: true,
				} )
			).toBe( LINK_DESTINATION_MEDIA );
		} );

		it( 'falls back to no link destination when the experiment is disabled and there is no media default', () => {
			window.__experimentalGalleryLightboxDefault = false;

			expect(
				getDefaultLinkDestination( undefined, { allowEditing: true } )
			).toBe( LINK_DESTINATION_NONE );
		} );

		it( 'uses lightbox when the experiment is enabled', () => {
			window.__experimentalGalleryLightboxDefault = true;

			expect(
				getDefaultLinkDestination( LINK_DESTINATION_MEDIA, {
					allowEditing: true,
				} )
			).toBe( LINK_DESTINATION_LIGHTBOX );
		} );

		it( 'uses lightbox when the experiment is enabled before lightbox settings load', () => {
			window.__experimentalGalleryLightboxDefault = true;

			expect(
				getDefaultLinkDestination( LINK_DESTINATION_MEDIA, undefined )
			).toBe( LINK_DESTINATION_LIGHTBOX );
		} );

		it( 'respects disabled lightbox editing', () => {
			window.__experimentalGalleryLightboxDefault = true;

			expect(
				getDefaultLinkDestination( LINK_DESTINATION_MEDIA, {
					allowEditing: false,
				} )
			).toBe( LINK_DESTINATION_MEDIA );
		} );
	} );

	describe( 'getHrefAndDestination', () => {
		it( 'enables lightbox when the gallery link destination is lightbox', () => {
			expect(
				getHrefAndDestination(
					{ source_url: 'https://example.com/image.jpg' },
					LINK_DESTINATION_LIGHTBOX,
					false,
					{},
					{ enabled: false }
				)
			).toMatchObject( {
				href: undefined,
				lightbox: { enabled: true },
			} );
		} );
	} );
} );
