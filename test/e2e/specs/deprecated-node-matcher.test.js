/**
 * Internal dependencies
 */
import {
	newPost,
	insertBlock,
	getEditedPostContent,
	META_KEY,
	pressWithModifier,
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
		expect( console ).toHaveWarned();
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should insert block with children source', async () => {
		await insertBlock( 'Deprecated Children Matcher' );
		await page.keyboard.type( 'test' );
		await page.keyboard.press( 'Enter' );
		await pressWithModifier( META_KEY, 'b' );
		await page.keyboard.type( 'test' );
		expect( console ).toHaveWarned();
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
