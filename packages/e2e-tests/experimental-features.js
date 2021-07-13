/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { visitAdminPage } from '@wordpress/e2e-test-utils';

async function setExperimentalFeaturesState( features, enable ) {
	const query = addQueryArgs( '', {
		page: 'gutenberg-experiments',
	} );
	await visitAdminPage( '/admin.php', query );

	await Promise.all(
		features.map( async ( feature ) => {
			await page.waitForSelector( feature );
			const checkedSelector = `${ feature }[checked=checked]`;
			const isChecked = !! ( await page.$( checkedSelector ) );
			if ( ( ! isChecked && enable ) || ( isChecked && ! enable ) ) {
				await page.click( feature );
			}
		} )
	);
	await Promise.all( [
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
		page.click( '#submit' ),
	] );
}

/**
 * Establishes test lifecycle to enable experimental feature for the duration of
 * the grouped test block.
 *
 * @param {Array} features Array of {string} selectors of settings to enable.
 *                         Assumes they can be enabled with one click.
 */
export function useExperimentalFeatures( features ) {
	beforeAll( () => setExperimentalFeaturesState( features, true ) );
	afterAll( () => setExperimentalFeaturesState( features, false ) );
}

export const navigationPanel = {
	async open() {
		const isOpen = !! ( await page.$(
			'.edit-site-navigation-toggle.is-open'
		) );

		if ( ! isOpen ) {
			await page.click( '.edit-site-navigation-toggle__button' );
			await page.waitForSelector( '.edit-site-navigation-panel' );
		}
	},

	async close() {
		const isOpen = !! ( await page.$(
			'.edit-site-navigation-toggle.is-open'
		) );

		if ( isOpen ) {
			await page.click( '.edit-site-navigation-toggle__button' );
		}
	},

	async isRoot() {
		const isBackToDashboardButtonVisible = !! ( await page.$(
			'.edit-site-navigation-panel .edit-site-navigation-panel__back-to-dashboard'
		) );

		return isBackToDashboardButtonVisible;
	},

	async back() {
		await page.click( '.components-navigation__back-button' );
	},

	async navigate( menus ) {
		if ( ! Array.isArray( menus ) ) {
			menus = [ menus ];
		}

		for ( const menu of menus ) {
			( await this.getItemByText( menu ) ).click();
		}
	},

	async backToRoot() {
		while ( ! ( await this.isRoot() ) ) {
			await this.back();
		}
	},

	async getItemByText( text ) {
		const selector = `//div[contains(@class, "edit-site-navigation-panel")]//button[contains(., "${ text }")]`;
		await page.waitForXPath( selector );
		const [ item ] = await page.$x( selector );
		return item;
	},

	async clickItemByText( text ) {
		const item = await this.getItemByText( text );
		await item.click();
	},
};

export const siteEditor = {
	async visit( query ) {
		query = addQueryArgs( '', {
			page: 'gutenberg-edit-site',
			...query,
		} ).slice( 1 );
		await visitAdminPage( 'admin.php', query );
		await page.waitForSelector( '.edit-site-visual-editor iframe' );
	},

	async toggleMoreMenu() {
		// eslint-disable-next-line jest/no-standalone-expect
		await expect( page ).toClick(
			'.edit-site-more-menu [aria-label="More tools & options"]'
		);
	},

	async clickOnMoreMenuItem( buttonLabel ) {
		await this.toggleMoreMenu();
		const moreMenuContainerSelector =
			'//*[contains(concat(" ", @class, " "), " edit-site-more-menu__content ")]';
		const elementToClick = (
			await page.$x(
				`${ moreMenuContainerSelector }//span[contains(concat(" ", @class, " "), " components-menu-item__item ")][contains(text(), "${ buttonLabel }")]`
			)
		 )[ 0 ];

		await elementToClick.click();
	},

	async getEditedPostContent() {
		return page.evaluate( async () => {
			const postId = window.wp.data
				.select( 'core/edit-site' )
				.getEditedPostId();
			const postType = window.wp.data
				.select( 'core/edit-site' )
				.getEditedPostType();
			const record = window.wp.data
				.select( 'core' )
				.getEditedEntityRecord( 'postType', postType, postId );
			if ( record ) {
				if ( typeof record.content === 'function' ) {
					return record.content( record );
				} else if ( record.blocks ) {
					return window.wp.blocks.__unstableSerializeAndClean(
						record.blocks
					);
				} else if ( record.content ) {
					return record.content;
				}
			}
			return '';
		} );
	},
};
