/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Regression coverage for the border block-support fallback. Verifies two
 * properties of the editor-time intelligent default + render-time fallback
 * that replaces the legacy `:where([style*="border-color"])` CSS rule:
 *
 *   1. Legacy / unmigrated block content that has a border color or width but
 *      no border style still renders with a visible solid border on the front
 *      end (backward-compatibility goal).
 *   2. Inline `style` attributes whose values merely contain the substring
 *      `border-color` — e.g. a `background-image: url(...border-color.png)`
 *      or a CSS custom property named `--border-color` — do NOT receive a
 *      spurious `border-style: solid` (regression #77476 root-cause goal).
 */
test.describe( 'Border block support', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// emptytheme provides a minimal theme.json so the resolved global
		// styles cascade does not interfere with the fallback logic.
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'legacy block with border color but no border style still renders a visible border on the front end', async ( {
		editor,
		page,
	} ) => {
		// Simulate content saved before the editor-time `solid` default was
		// introduced: a group with `style.border.color` but no `border.style`.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				style: {
					border: {
						color: '#ff0000',
						width: '4px',
					},
				},
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Legacy border content.' },
				},
			],
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const group = page.locator( '.wp-block-group.has-border-color' );
		await expect( group ).toBeVisible();

		const computed = await group.evaluate( ( el ) => {
			const style = window.getComputedStyle( el );
			return {
				borderTopStyle: style.borderTopStyle,
				borderRightStyle: style.borderRightStyle,
				borderBottomStyle: style.borderBottomStyle,
				borderLeftStyle: style.borderLeftStyle,
				borderTopColor: style.borderTopColor,
				borderTopWidth: style.borderTopWidth,
			};
		} );

		expect( computed.borderTopStyle ).toBe( 'solid' );
		expect( computed.borderRightStyle ).toBe( 'solid' );
		expect( computed.borderBottomStyle ).toBe( 'solid' );
		expect( computed.borderLeftStyle ).toBe( 'solid' );
		expect( computed.borderTopColor ).toBe( 'rgb(255, 0, 0)' );
		expect( computed.borderTopWidth ).toBe( '4px' );
	} );
} );

test.describe( 'Border block support — no false positives', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'an element whose inline `style` contains a `background-image: url(...border-color...)` does not get a spurious solid border (regression #77476)', async ( {
		requestUtils,
		page,
	} ) => {
		const { id: postId } = await requestUtils.createPost( {
			title: 'Border substring regression',
			status: 'publish',
			content:
				'<div id="false-positive-bg" style="background-image:url(\'/wp-content/border-color-decoration.png\');width:120px;height:120px;">x</div>',
		} );

		await page.goto( `/?p=${ postId }` );

		const target = page.locator( '#false-positive-bg' );
		await expect( target ).toBeVisible();

		const computed = await target.evaluate( ( el ) => {
			const s = window.getComputedStyle( el );
			return {
				borderTopStyle: s.borderTopStyle,
				borderRightStyle: s.borderRightStyle,
				borderBottomStyle: s.borderBottomStyle,
				borderLeftStyle: s.borderLeftStyle,
			};
		} );

		// `none` is the CSS initial value. The legacy `:where()` rule we
		// removed would have forced these to `solid` because the inline
		// style string contains the substring `border-color`.
		expect( computed.borderTopStyle ).toBe( 'none' );
		expect( computed.borderRightStyle ).toBe( 'none' );
		expect( computed.borderBottomStyle ).toBe( 'none' );
		expect( computed.borderLeftStyle ).toBe( 'none' );
	} );

	test( 'an element whose inline `style` declares a `--border-color` custom property does not get a spurious solid border (regression #77476)', async ( {
		requestUtils,
		page,
	} ) => {
		const { id: postId } = await requestUtils.createPost( {
			title: 'Border custom property regression',
			status: 'publish',
			content:
				'<div id="false-positive-var" style="--border-color:red;width:120px;height:120px;">x</div>',
		} );

		await page.goto( `/?p=${ postId }` );

		const target = page.locator( '#false-positive-var' );
		await expect( target ).toBeVisible();

		const computed = await target.evaluate( ( el ) => {
			const s = window.getComputedStyle( el );
			return {
				borderTopStyle: s.borderTopStyle,
				borderRightStyle: s.borderRightStyle,
				borderBottomStyle: s.borderBottomStyle,
				borderLeftStyle: s.borderLeftStyle,
			};
		} );

		expect( computed.borderTopStyle ).toBe( 'none' );
		expect( computed.borderRightStyle ).toBe( 'none' );
		expect( computed.borderBottomStyle ).toBe( 'none' );
		expect( computed.borderLeftStyle ).toBe( 'none' );
	} );
} );
