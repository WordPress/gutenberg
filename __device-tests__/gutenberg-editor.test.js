/**
 * @format
 * */

import EditorPage from './pages/editor-page';
import ParagraphBlock from './blocks/paragraph-block';
import { rename, setupAppium, setupDriver } from './utils';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

describe( 'Gutenberg Editor tests', () => {
	let appium;
	let driver;
	let editorPage;

	const setupData = async () => {
		await rename( 'src/app/initial-html.js', 'src/app/initial-html.tmp.js' );
		await rename( 'src/app/initial-device-tests-html.js', 'src/app/initial-html.js' );
	};

	beforeAll( async () => {
		await setupData();
		appium = await setupAppium();
		driver = await setupDriver();
	} );

	it( 'should be able to see visual editor', async () => {
		editorPage = new EditorPage( driver );
		await editorPage.expect();
	} );

	it( 'should be able to add a new Paragraph block', async () => {
		let paragraphBlock = new ParagraphBlock( driver, 'Paragraph' );
		paragraphBlock = await editorPage.addNewBlock( paragraphBlock );
		await paragraphBlock.sendText( 'Hello Gutenberg!' );

		expect( await paragraphBlock.getText() ).toBe( 'Hello Gutenberg!' );
	} );

	afterAll( async () => {
		await rename( 'src/app/initial-html.js', 'src/app/initial-device-tests-html.js' );
		await rename( 'src/app/initial-html.tmp.js', 'src/app/initial-html.js' );
		await driver.quit();
		await appium.kill( 'SIGINT' );
	} );
} );
