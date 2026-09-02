import variations, { isGifVariation } from '../variations';

describe( 'isGifVariation', () => {
	it( 'matches when isGif is true', () => {
		expect( isGifVariation( { isGif: true } ) ).toBe( true );
	} );

	it( 'does not match when attributes manually match autoplay/loop/no-controls without isGif', () => {
		expect(
			isGifVariation( {
				controls: false,
				loop: true,
				autoplay: true,
				muted: true,
				playsInline: true,
			} )
		).toBe( false );
	} );

	it( 'does not match when isGif is false or omitted', () => {
		expect( isGifVariation( { isGif: false } ) ).toBe( false );
		expect( isGifVariation( { controls: true } ) ).toBe( false );
		expect( isGifVariation( {} ) ).toBe( false );
		expect( isGifVariation() ).toBe( false );
	} );
} );

describe( 'video variations', () => {
	it( 'activates the GIF variation only when isGif is true', () => {
		const activeGif = variations.filter( ( variation ) =>
			variation.isActive( { isGif: true } )
		);
		expect( activeGif ).toHaveLength( 1 );
		expect( activeGif[ 0 ].name ).toBe( 'gif' );
	} );

	it( 'activates the standard video variation when manually setting autoplay+loop+no-controls without isGif', () => {
		const activeVideo = variations.filter( ( variation ) =>
			variation.isActive( {
				controls: false,
				loop: true,
				autoplay: true,
				muted: true,
				playsInline: true,
			} )
		);
		expect( activeVideo ).toHaveLength( 1 );
		expect( activeVideo[ 0 ].name ).toBe( 'video' );
	} );

	it( 'provides attributes that reset isGif to false when switching to standard video', () => {
		const videoVariation = variations.find(
			( variation ) => variation.name === 'video'
		);
		expect( videoVariation.attributes.isGif ).toBe( false );
	} );

	it( 'provides attributes that set isGif to true for the GIF variation', () => {
		const gifVariation = variations.find(
			( variation ) => variation.name === 'gif'
		);
		expect( gifVariation.attributes.isGif ).toBe( true );
	} );

	it( 'keeps the GIF variation out of the inserter', () => {
		const gif = variations.find(
			( variation ) => variation.name === 'gif'
		);
		expect( gif.scope ).not.toContain( 'inserter' );
	} );
} );
