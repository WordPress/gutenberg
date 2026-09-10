/**
 * Internal dependencies
 */
import { findGitHubHostedImages } from '../check-doc-image-hosting.mjs';

describe( 'findGitHubHostedImages', () => {
	it( 'flags raw.githubusercontent.com raster images', () => {
		const findings = findGitHubHostedImages(
			'![alt](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/example.png)'
		);

		expect( findings ).toHaveLength( 1 );
		expect( findings[ 0 ].line ).toBe( 1 );
		expect( findings[ 0 ].message ).toContain( 'GitHub-hosted image' );
	} );

	it( 'flags GitHub-hosted images referenced from an <img> tag', () => {
		const findings = findGitHubHostedImages(
			'<img src="https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/example.jpg" alt="x">'
		);

		expect( findings ).toHaveLength( 1 );
	} );

	it( 'flags ?raw=true URLs', () => {
		const findings = findGitHubHostedImages(
			'![alt](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/example.png?raw=true)'
		);

		expect( findings ).toHaveLength( 1 );
	} );

	it( 'flags github.com user-attachments assets without an extension', () => {
		const findings = findGitHubHostedImages(
			'![alt](https://github.com/user-attachments/assets/abc-123-def)'
		);

		expect( findings ).toHaveLength( 1 );
	} );

	it( 'flags webp and avif raster images', () => {
		const findings = findGitHubHostedImages(
			'![a](https://raw.githubusercontent.com/x/a.webp) ![b](https://raw.githubusercontent.com/x/b.avif)'
		);

		expect( findings ).toHaveLength( 2 );
	} );

	it( 'exempts SVGs (the Media Library does not accept SVG uploads)', () => {
		const findings = findGitHubHostedImages(
			'<img src="https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/logo.svg" alt="logo">'
		);

		expect( findings ).toEqual( [] );
	} );

	it( 'ignores images already hosted on developer.wordpress.org', () => {
		const findings = findGitHubHostedImages(
			'![alt](https://developer.wordpress.org/files/2026/06/example.png)'
		);

		expect( findings ).toEqual( [] );
	} );

	it( 'ignores non-image GitHub links such as .md files', () => {
		const findings = findGitHubHostedImages(
			'[template](https://raw.githubusercontent.com/WordPress/gutenberg/trunk/docs/contributors/documentation/how-to-guide-template.md)'
		);

		expect( findings ).toEqual( [] );
	} );

	it( 'reports correct line numbers for multiple findings', () => {
		const content = [
			'# Heading',
			'![a](https://raw.githubusercontent.com/x/a.png)',
			'',
			'Some prose with no image.',
			'![b](https://user-images.githubusercontent.com/1/b.gif)',
		].join( '\n' );

		const findings = findGitHubHostedImages( content );

		expect( findings.map( ( finding ) => finding.line ) ).toEqual( [
			2, 5,
		] );
	} );

	it( 'returns no findings for content without images', () => {
		expect( findGitHubHostedImages( 'Just some text.' ) ).toEqual( [] );
	} );
} );
