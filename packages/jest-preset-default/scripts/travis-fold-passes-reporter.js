/**
 * External dependencies
 */
const { VerboseReporter } = require( '@jest/reporters' );

module.exports = class TravisFoldPassesReporter extends VerboseReporter {
	constructor( ...args ) {
		super( ...args );
		this.foldedTestResults = [];
	}

	flushFoldedTestResults() {
		if ( ! this.foldedTestResults.length ) {
			return;
		}

		this.log( 'travis_fold:start:TravisFoldPassesReporter' );
		this.log(
			`...${ this.foldedTestResults.length } passing test${
				this.foldedTestResults.length === 1 ? '' : 's'
			}.`
		);
		this.foldedTestResults.forEach( ( args ) =>
			super.onTestResult( ...args )
		);
		this.log( 'travis_fold:end:TravisFoldPassesReporter' );
		this.foldedTestResults = [];
	}

	onTestResult( ...args ) {
		const testResult = args[ 1 ];
		if ( testResult.numFailingTests === 0 && ! testResult.failureMessage ) {
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
};
