const { writeFile, mkdir } = require( 'fs' ).promises;
const filenamify = require( 'filenamify' );
const PuppeteerEnvironment = require( 'jest-environment-puppeteer' );

const root = process.env.GITHUB_WORKSPACE || process.cwd();
const ARTIFACTS_PATH = root + '/artifacts';

class JestPuppeteerEnvironment extends PuppeteerEnvironment {
	async setup() {
		await super.setup();

		try {
			await mkdir( ARTIFACTS_PATH );
		} catch ( err ) {
			if ( err.code !== 'EEXIST' ) {
				throw err;
			}
		}
	}

	async storeArtifacts( testName ) {
		const datetime = new Date().toISOString().split( '.' )[ 0 ];
		const fileName = filenamify( `${ testName } ${ datetime }`, {
			replacement: '-',
		} );
		await writeFile(
			`${ ARTIFACTS_PATH }/${ fileName }-snapshot.html`,
			await this.global.page.content()
		);
		await this.global.page.screenshot( {
			path: `${ ARTIFACTS_PATH }/${ fileName }.jpg`,
		} );
	}

	async handleTestEvent( event, state ) {
		if ( event.name === 'test_fn_failure' ) {
			const testName = state.currentlyRunningTest.name;
			await this.storeArtifacts( testName );
		}
	}
}

module.exports = JestPuppeteerEnvironment;
