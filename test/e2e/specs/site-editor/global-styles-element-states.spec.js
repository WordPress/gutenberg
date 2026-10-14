const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Every state gets its own color, so a preview showing the wrong state can't
// pass by accident.
const DEFAULT_COLOR = '#1d4ed8';
const STATE_COLORS = {
	':link': '#15803d',
	':visited': '#7e22ce',
	':hover': '#dc2626',
	':focus': '#0891b2',
	':focus-visible': '#db2777',
	':active': '#854d0e',
};

const ELEMENTS = [
	{
		name: 'Link',
		listItem: 'Link',
		property: 'color',
		frontEndLink: 'Text link',
		getStyles: ( color ) => ( { color: { text: color } } ),
	},
	{
		name: 'Button',
		listItem: 'Button (element)',
		property: 'background-color',
		frontEndLink: 'Button link',
		getStyles: ( color ) => ( {
			color: { background: color, text: '#ffffff' },
		} ),
	},
];

// How a visitor puts a link in each state on the front end.
const INTERACTIONS = {
	// An unvisited link at rest matches `:link`.
	rest: async () => {},
	hover: async ( page, target ) => {
		await target.hover();
	},
	// Clicking focuses the link without `:focus-visible`.
	click: async ( page, target ) => {
		await target.click();
		await page.mouse.move( 0, 0 );
	},
	// Tabbing to the link focuses it with `:focus-visible`.
	tab: async ( page, target ) => {
		for ( let i = 0; i < 50; i++ ) {
			if (
				await target.evaluate(
					( element ) =>
						element === element.ownerDocument.activeElement
				)
			) {
				return;
			}
			await page.keyboard.press( 'Tab' );
		}
	},
	press: async ( page, target ) => {
		await target.hover();
		await page.mouse.down();
	},
};

// The front end interaction each state in the States menu stands for.
// Visited is left out: browsers hide `:visited` styles from scripts.
const PREVIEW_STATES = [
	[ 'Default', 'rest' ],
	[ 'Link', 'rest' ],
	[ 'Hover', 'hover' ],
	[ 'Focus', 'click' ],
	[ 'Focus-visible', 'tab' ],
	[ 'Active', 'press' ],
];

test.describe( 'Global Styles - Element state previews', () => {
	let postId;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );

		const elements = {};
		for ( const element of ELEMENTS ) {
			const styles = element.getStyles( DEFAULT_COLOR );
			for ( const [ state, color ] of Object.entries( STATE_COLORS ) ) {
				styles[ state ] = element.getStyles( color );
			}
			elements[ element.name.toLowerCase() ] = styles;
		}
		const stylesPostId =
			await requestUtils.getCurrentThemeGlobalStylesPostId();
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/global-styles/${ stylesPostId }`,
			data: { id: stylesPostId, styles: { elements } },
		} );

		( { id: postId } = await requestUtils.createPost( {
			title: 'Element states',
			status: 'publish',
			content:
				'<!-- wp:paragraph --><p><a href="https://example.com/">Text link</a></p><!-- /wp:paragraph -->' +
				'<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://example.com/">Button link</a></div><!-- /wp:button --></div><!-- /wp:buttons -->',
		} ) );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.resetThemeGlobalStyles();
		await requestUtils.deleteAllPosts();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	for ( const element of ELEMENTS ) {
		test( `previews the ${ element.name.toLowerCase() } in each state as the front end shows it`, async ( {
			admin,
			page,
		} ) => {
			const target = page.getByRole( 'link', {
				name: element.frontEndLink,
			} );

			const frontEnd = {};
			for ( const [ interaction, interact ] of Object.entries(
				INTERACTIONS
			) ) {
				await page.goto( `/?p=${ postId }` );
				// Keep clicks from following the link, so its focus can be read.
				await page.evaluate( () =>
					document.addEventListener(
						'click',
						( event ) => event.preventDefault(),
						true
					)
				);
				await interact( page, target );
				frontEnd[ interaction ] = await target.evaluate(
					( link, property ) =>
						window
							.getComputedStyle( link )
							.getPropertyValue( property ),
					element.property
				);
				await page.mouse.up();
			}

			// Each interaction shows a different state, so the comparison
			// below means something.
			expect( new Set( Object.values( frontEnd ) ).size ).toBe(
				Object.keys( INTERACTIONS ).length
			);

			await admin.visitSiteEditor( {
				postId: 'emptytheme//index',
				postType: 'wp_template',
				canvas: 'edit',
			} );
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Blocks & Elements' } )
				.click();
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: element.listItem, exact: true } )
				.click();

			const sample = page
				.locator( '.global-styles-ui-element-preview iframe' )
				.contentFrame()
				.locator( 'a' );

			for ( const [ state, interaction ] of PREVIEW_STATES ) {
				await test.step( state, async () => {
					await page
						.getByRole( 'region', { name: 'Editor settings' } )
						.getByRole( 'button', { name: 'States' } )
						.click();
					await page
						.getByRole( 'menuitem', { name: state, exact: true } )
						.click();

					await expect
						.soft(
							sample,
							`${ state } preview should match the front end`
						)
						.toHaveCSS( element.property, frontEnd[ interaction ] );
				} );
			}
		} );
	}
} );
