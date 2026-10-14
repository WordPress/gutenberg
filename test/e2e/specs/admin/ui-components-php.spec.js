/**
 * Visual check for the server-rendered `@wordpress/ui` components.
 *
 * The PHPUnit tests compare PHP markup with React's, but identical markup can
 * still look different, for example when a stylesheet is missing from the PHP
 * build. This screenshots each example on Tools → UI Components twice,
 * rendered by PHP with the PHP stylesheet, and as React's markup with all of the
 * package's styles, and compares them pixel by pixel. React is the baseline, so
 * there are no reference images to keep up to date.
 */
const { writeFile, mkdir, rm } = require( 'node:fs/promises' );
const path = require( 'node:path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'UI components rendered by PHP', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-ui-php-components',
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'look the same as the React components', async ( {
		admin,
		page,
	}, testInfo ) => {
		// Screenshot every example as rendered on its own: by PHP with the PHP
		// stylesheet, or React's markup with all of the package's stylesheets.
		const capture = async ( sample ) => {
			await admin.visitAdminPage(
				'tools.php',
				`page=gutenberg-ui-components&sample=${ sample }`
			);
			const examples = page.locator( '[data-example]' );
			await expect( examples.first() ).toBeVisible();
			// React features elsewhere in wp-admin inject `@wordpress/ui` styles
			// at runtime, which would hide a stylesheet missing from the PHP build.
			await page.evaluate( () =>
				document
					.querySelectorAll( 'style[data-wp-hash]' )
					.forEach( ( style ) => style.remove() )
			);
			const screenshots = new Map();
			for ( const example of await examples.all() ) {
				screenshots.set(
					await example.getAttribute( 'data-example' ),
					await example.screenshot( { animations: 'disabled' } )
				);
			}
			return screenshots;
		};

		const react = await capture( 'react' );
		const php = await capture( 'php' );
		expect( [ ...php.keys() ] ).toEqual( [ ...react.keys() ] );

		for ( const [ name, screenshot ] of php ) {
			// Store the React render where `toMatchSnapshot()` expects its
			// baseline, so Playwright's image comparison checks PHP against it.
			const snapshotName = `${ name.replace( /[^a-z0-9]+/gi, '-' ) }.png`;
			const baseline = testInfo.snapshotPath( snapshotName );
			await mkdir( path.dirname( baseline ), { recursive: true } );
			await writeFile( baseline, react.get( name ) );
			try {
				expect.soft( screenshot, name ).toMatchSnapshot( snapshotName, {
					maxDiffPixelRatio: 0.01,
				} );
			} finally {
				// The baseline is temporary; nothing is kept in the repository.
				await rm( path.dirname( baseline ), {
					recursive: true,
					force: true,
				} );
			}
		}
	} );
} );
