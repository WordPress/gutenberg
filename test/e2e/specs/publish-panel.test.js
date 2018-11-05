import {
	arePrePublishChecksEnabled,
	disablePrePublishChecks,
	enablePrePublishChecks,
	newPost,
	openPublishPanel,
	pressWithModifier,
} from '../support/utils';

describe( 'PostPublishPanel', () => {
	[ 'post', 'page' ].forEach( ( postType ) => {
		let werePrePublishChecksEnabled;
		beforeEach( async () => {
			await newPost( postType );
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

		it( 'publish button should have focus', async () => {
			await openPublishPanel();

			const focusedElementClassList = await page.$eval( ':focus', ( focusedElement ) => {
				return Object.values( focusedElement.classList );
			} );
			expect( focusedElementClassList ).toBe( 'editor-post-publish-button' );
		} );

		it( 'should retain focus within the panel', async () => {
			await openPublishPanel();
			await pressWithModifier( 'Shift', 'Tab' );

			const focusedElementClassList = await page.$eval( ':focus', ( focusedElement ) => {
				return Object.values( focusedElement.classList );
			} );
			expect( focusedElementClassList ).toBe( 'components-checkbox-control__input' );
		} );
	} );
} );
