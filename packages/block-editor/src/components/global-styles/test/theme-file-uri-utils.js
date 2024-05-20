/**
 * Internal dependencies
 */
import {
	setThemeFileUris,
	getResolvedThemeFilePath,
} from '../theme-file-uri-utils';

const themeFileURIs = [
	{
		name: 'file:./assets/image.jpg',
		href: 'https://wordpress.org/assets/image.jpg',
		target: 'styles.background.backgroundImage.url',
	},
	{
		name: 'file:./assets/other/image.jpg',
		href: 'https://wordpress.org/assets/other/image.jpg',
		target: "styles.blocks.['core/group].background.backgroundImage.url",
	},
];

describe( 'setThemeFileUris()', () => {
	const themeJson = {
		styles: {
			background: {
				backgroundImage: {
					url: 'file:./assets/image.jpg',
				},
			},
		},
	};

	it( 'should replace relative paths with resolved URIs if found in themeFileURIs', () => {
		const newThemeJson = setThemeFileUris( themeJson, themeFileURIs );
		expect(
			newThemeJson.styles.background.backgroundImage.url ===
				'https://wordpress.org/assets/image.jpg'
		).toBe( true );
		// Object reference should be the same as the function is mutating the object.
		expect( newThemeJson ).toEqual( themeJson );
	} );
} );

describe( 'getResolvedThemeFilePath()', () => {
	it.each( [
		[
			'file:./assets/image.jpg',
			'https://wordpress.org/assets/image.jpg',
			'Should return absolute URL if found in themeFileURIs',
		],
		[
			'file:./misc/image.jpg',
			'file:./misc/image.jpg',
			'Should return value if not found in themeFileURIs',
		],
		[
			'https://wordpress.org/assets/image.jpg',
			'https://wordpress.org/assets/image.jpg',
			'Should not match absolute URLs',
		],
	] )( 'Given file %s and return value %s: %s', ( file, returnedValue ) => {
		expect(
			getResolvedThemeFilePath( file, themeFileURIs ) === returnedValue
		).toBe( true );
	} );
} );
