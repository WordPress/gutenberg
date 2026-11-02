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
		sample: 'a',
		getFrontEndTarget: () => ( { role: 'link', name: 'Text link' } ),
		getStyles: ( color ) => ( { color: { text: color } } ),
	},
	{
		name: 'Button',
		listItem: 'Form button',
		property: 'background-color',
		sample: '.wp-element-button',
		// The preview shows a link, like a Button block, for the states only
		// links match, and a form button, like the Search block's, otherwise.
		getFrontEndTarget: ( linkOnly ) =>
			linkOnly
				? { role: 'link', name: 'Button link' }
				: { role: 'button', name: 'Search' },
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

// The front end interaction each state in the States menu stands for, and
// whether only links match the state.
// Visited is left out: browsers hide `:visited` styles from scripts.
const PREVIEW_STATES = [
	{ state: 'Default', interaction: 'rest' },
	{ state: 'Link', interaction: 'rest', linkOnly: true },
	{ state: 'Hover', interaction: 'hover' },
	{ state: 'Focus', interaction: 'click' },
	{ state: 'Focus-visible', interaction: 'tab' },
	{ state: 'Active', interaction: 'press' },
];

// Names what a preview state is compared with on the front end.
function getFrontEndKey( element, { interaction, linkOnly } ) {
	const { role, name } = element.getFrontEndTarget( linkOnly );
	return `${ role } "${ name }" ${ interaction }`;
}

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
				'<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://example.com/">Button link</a></div><!-- /wp:button --></div><!-- /wp:buttons -->' +
				'<!-- wp:search {"label":"Search","buttonText":"Search"} /-->',
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
			const frontEnd = {};
			for ( const previewState of PREVIEW_STATES ) {
				const key = getFrontEndKey( element, previewState );
				if ( key in frontEnd ) {
					continue;
				}
				const { role, name } = element.getFrontEndTarget(
					previewState.linkOnly
				);
				const target = page.getByRole( role, { name, exact: true } );
				await page.goto( `/?p=${ postId }` );
				// Keep clicks from following a link or submitting the search,
				// so the target's focus can be read.
				await page.evaluate( () =>
					document.addEventListener(
						'click',
						( event ) => event.preventDefault(),
						true
					)
				);
				await INTERACTIONS[ previewState.interaction ]( page, target );
				frontEnd[ key ] = await target.evaluate(
					( node, property ) =>
						window
							.getComputedStyle( node )
							.getPropertyValue( property ),
					element.property
				);
				await page.mouse.up();
			}

			// Each target and interaction shows a different state, so the
			// comparison below means something.
			expect( new Set( Object.values( frontEnd ) ).size ).toBe(
				Object.keys( frontEnd ).length
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
				.locator( element.sample );

			for ( const previewState of PREVIEW_STATES ) {
				const { state } = previewState;

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
						.toHaveCSS(
							element.property,
							frontEnd[ getFrontEndKey( element, previewState ) ]
						);
				} );
			}
		} );
	}
} );
