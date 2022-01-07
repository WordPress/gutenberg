/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { visitAdminPage } from '@wordpress/e2e-test-utils';

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
		const item = await page.waitForXPath(
			`//div[contains(@class, "edit-site-navigation-panel")]//button[.//*[text()="${ text }"]]`,
			{ visible: true }
		);
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
		await visitAdminPage( 'themes.php', query );
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

	async disableWelcomeGuide() {
		const isWelcomeGuideActive = await page.evaluate( () =>
			wp.data.select( 'core/edit-site' ).isFeatureActive( 'welcomeGuide' )
		);
		const isWelcomeGuideStyesActive = await page.evaluate( () =>
			wp.data
				.select( 'core/edit-site' )
				.isFeatureActive( 'welcomeGuideStyles' )
		);

		if ( isWelcomeGuideActive ) {
			await page.evaluate( () =>
				wp.data
					.dispatch( 'core/edit-site' )
					.toggleFeature( 'welcomeGuide' )
			);
		}

		if ( isWelcomeGuideStyesActive ) {
			await page.evaluate( () =>
				wp.data
					.dispatch( 'core/edit-site' )
					.toggleFeature( 'welcomeGuideStyles' )
			);
		}
	},
};
