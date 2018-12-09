/**
 * Node dependencies
 */
import AxePuppeteer from 'axe-puppeteer';

/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	newPost,
	logA11yResults,
} from '../../support/utils';

describe( 'Code', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'can be created by three backticks and enter', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '```' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '<?php' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		const axe = new AxePuppeteer( page );
		axe.include( '.edit-post-layout__content' );
		logA11yResults( await axe.analyze() );
	} );
} );
