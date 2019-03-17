/**
 * @format
 * */

import EditorPage from './pages/editor-page';
import ParagraphBlockInteraction from './blocks/paragraph-block-interaction';
import { rename, setupAppium, setupDriver, isLocalEnvironment, timer } from './helpers/utils';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

describe( 'Gutenberg Editor tests', () => {
	let appium;
	let driver;
	let editorPage;
	let allPassed = true;

	// Use reporter for setting status for saucelabs Job
	if ( ! isLocalEnvironment() ) {
		const reporter = {
			specDone: async ( result ) => {
				allPassed = allPassed && result.status !== 'failed';
			},
		};

		jasmine.getEnv().addReporter( reporter );
	}

	const setupData = async () => {
		await rename( 'src/app/initial-html.js', 'src/app/initial-html.tmp.js' );
		await rename( 'src/app/initial-device-tests-html.js', 'src/app/initial-html.js' );
	};

	beforeAll( async () => {
		if ( isLocalEnvironment() ) {
			await setupData();
			appium = await setupAppium();
		}

		driver = await setupDriver();
	} );

	it( 'should be able to see visual editor', async () => {
		editorPage = new EditorPage( driver );
		await editorPage.expect();
	} );

	it( 'should be able to add a new Paragraph block', async () => {
		let paragraphBlockInteraction = new ParagraphBlockInteraction( driver, 'Paragraph' );
		paragraphBlockInteraction = await editorPage.addNewBlock( paragraphBlockInteraction );
		await paragraphBlockInteraction.sendText( 'Hello Gutenberg!' );
		await timer( 3000 );
		expect( await paragraphBlockInteraction.getText() ).toBe( 'Hello Gutenberg!' );
	} );

	afterAll( async () => {
		await driver.quit();
		if ( isLocalEnvironment() ) {
			await rename( 'src/app/initial-html.js', 'src/app/initial-device-tests-html.js' );
			await rename( 'src/app/initial-html.tmp.js', 'src/app/initial-html.js' );
			await appium.kill( 'SIGINT' );
		} else {
			driver.sauceJobStatus( allPassed );
		}
	} );
} );
