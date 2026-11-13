import { afterEach, describe, expect, it } from 'vitest';
import {
	getDefaultLinkDestination,
	isRememberedLinkDestination,
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_CUSTOM,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_NONE,
} from '../link-destination';

describe( 'isRememberedLinkDestination', () => {
	it.each( [
		LINK_DESTINATION_NONE,
		LINK_DESTINATION_MEDIA,
		LINK_DESTINATION_ATTACHMENT,
	] )( 'remembers the "%s" link destination', ( linkDestination ) => {
		expect( isRememberedLinkDestination( linkDestination ) ).toBe( true );
	} );

	it.each( [ LINK_DESTINATION_CUSTOM, undefined, null, '', 'file', {} ] )(
		'does not remember %p',
		( linkDestination ) => {
			expect( isRememberedLinkDestination( linkDestination ) ).toBe(
				false
			);
		}
	);
} );

describe( 'getDefaultLinkDestination', () => {
	const originalWp = ( window as { wp?: unknown } ).wp;

	function setSiteDefaultLinkType( link: string | undefined ) {
		Object.assign( window, {
			wp:
				link === undefined
					? undefined
					: {
							media: {
								view: { settings: { defaultProps: { link } } },
							},
						},
		} );
	}

	afterEach( () => {
		Object.assign( window, { wp: originalWp } );
	} );

	it( 'falls back to none when there is no site default', () => {
		setSiteDefaultLinkType( undefined );
		expect( getDefaultLinkDestination() ).toBe( LINK_DESTINATION_NONE );
	} );

	it.each( [
		[ 'file', LINK_DESTINATION_MEDIA ],
		[ 'post', LINK_DESTINATION_ATTACHMENT ],
		[ 'custom', LINK_DESTINATION_CUSTOM ],
		[ 'none', LINK_DESTINATION_NONE ],
	] )(
		'maps the "%s" site default to "%s"',
		( siteDefault, linkDestination ) => {
			setSiteDefaultLinkType( siteDefault );
			expect( getDefaultLinkDestination() ).toBe( linkDestination );
		}
	);

	it.each( [
		LINK_DESTINATION_NONE,
		LINK_DESTINATION_MEDIA,
		LINK_DESTINATION_ATTACHMENT,
	] )(
		'prefers the remembered "%s" link destination over the site default',
		( linkDestination ) => {
			setSiteDefaultLinkType( 'file' );
			expect( getDefaultLinkDestination( linkDestination ) ).toBe(
				linkDestination
			);
		}
	);

	it.each( [ LINK_DESTINATION_CUSTOM, 'file', 42, null ] )(
		'ignores the invalid remembered value %p',
		( rememberedLinkDestination ) => {
			setSiteDefaultLinkType( 'post' );
			expect(
				getDefaultLinkDestination( rememberedLinkDestination )
			).toBe( LINK_DESTINATION_ATTACHMENT );
		}
	);
} );
