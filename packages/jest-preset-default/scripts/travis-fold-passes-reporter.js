/**
 * External dependencies
 */
const { DefaultReporter } = require( '@jest/reporters' );

class TravisFoldPassesReporter extends DefaultReporter {
	constructor( ...args ) {
		super( ...args );
		this.foldedTestResults = [];
	}

	flushFoldedTestResults() {
		if ( this.foldedTestResults.length > 0 ) {
			this.log( 'travis_fold:start:TravisFoldPassesReporter' );
			this.log(
				`...${ this.foldedTestResults.length } passing test${
					this.foldedTestResults.length === 1 ? '' : 's'
				}.`
			);
			this.foldedTestResults.forEach( ( args ) => super.onTestResult( ...args ) );
			this.log( 'travis_fold:end:TravisFoldPassesReporter' );
			this.foldedTestResults = [];
		}
	}

	onTestResult( ...args ) {
		if ( args[ 1 ].numFailingTests === 0 && ! args[ 1 ].failureMessage ) {
			this.foldedTestResults.push( args );
		} else {
			this.flushFoldedTestResults();
			super.onTestResult( ...args );
		}
	}

	onRunComplete( ...args ) {
		this.flushFoldedTestResults();
		super.onRunComplete( ...args );
	}
}

module.exports =
	'TRAVIS' in process.env && 'CI' in process.env ?
		TravisFoldPassesReporter :
		DefaultReporter;
