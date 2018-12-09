/**
 * Node dependencies
 */
import AxePuppeteer from 'axe-puppeteer';

/**
 * Internal dependencies
 */
import {
	newPost,
	insertBlock,
	getEditedPostContent,
	pressWithModifier,
	logA11yResults,
} from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

describe( 'Deprecated Node Matcher', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-deprecated-node-matcher' );
	} );

	beforeEach( async () => {
		await newPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-deprecated-node-matcher' );
	} );

	it( 'should insert block with node source', async () => {
		await insertBlock( 'Deprecated Node Matcher' );
		await page.keyboard.type( 'test' );
		await page.keyboard.press( 'Enter' );

		const axe = new AxePuppeteer( page );
		axe.include( '.edit-post-layout__content' );
		logA11yResults( await axe.analyze() );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert block with children source', async () => {
		await insertBlock( 'Deprecated Children Matcher' );
		await page.keyboard.type( 'test' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await pressWithModifier( 'primary', 'b' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		const axe = new AxePuppeteer( page );
		axe.include( '.edit-post-layout__content' );
		logA11yResults( await axe.analyze() );
	} );
} );
