/**
 * Node dependencies
 */
import AxePuppeteer from 'axe-puppeteer';

import {
	arePrePublishChecksEnabled,
	disablePrePublishChecks,
	enablePrePublishChecks,
	newPost,
	openPublishPanel,
	pressWithModifier,
	publishPost,
	logA11yResults,
} from '../support/utils';

describe( 'PostPublishPanel', () => {
	let werePrePublishChecksEnabled;
	beforeEach( async () => {
		await newPost( );
		werePrePublishChecksEnabled = await arePrePublishChecksEnabled();
		if ( ! werePrePublishChecksEnabled ) {
			await enablePrePublishChecks();
		}
	} );

	afterEach( async () => {
		if ( ! werePrePublishChecksEnabled ) {
			await disablePrePublishChecks();
		}
	} );

	it( 'PrePublish: publish button should have the focus', async () => {
		await page.type( '.editor-post-title__input', 'E2E Test Post' );
		await openPublishPanel();

		const focusedElementClassList = await page.$eval( ':focus', ( focusedElement ) => {
			return Object.values( focusedElement.classList );
		} );
		expect( focusedElementClassList ).toContain( 'editor-post-publish-button' );
	} );

	it( 'PostPublish: post link should have the focus', async () => {
		const postTitle = 'E2E Test Post';
		await page.type( '.editor-post-title__input', postTitle );
		await publishPost();

		const focusedElementTag = await page.$eval( ':focus', ( focusedElement ) => {
			return focusedElement.tagName.toLowerCase();
		} );
		const focusedElementText = await page.$eval( ':focus', ( focusedElement ) => {
			return focusedElement.text;
		} );
		expect( focusedElementTag ).toBe( 'a' );
		expect( focusedElementText ).toBe( postTitle );
	} );

	it( 'should retain focus within the panel', async () => {
		await page.type( '.editor-post-title__input', 'E2E Test Post' );
		await openPublishPanel();
		await pressWithModifier( 'shift', 'Tab' );

		const focusedElementClassList = await page.$eval( ':focus', ( focusedElement ) => {
			return Object.values( focusedElement.classList );
		} );
		expect( focusedElementClassList ).toContain( 'components-checkbox-control__input' );

		const axe = new AxePuppeteer( page );
		axe.include( '.edit-post-layout__content' );
		logA11yResults( await axe.analyze() );
	} );
} );
