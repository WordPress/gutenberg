/**
 * Based on https://github.com/facebook/jest/pull/11320.
 *
 * We might be able to remove this file once the Jest PR is merged, and a
 * version of Jest that includes the GithubActionsReporter is released.
 */

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const newLine = /\n/g;
const encodedNewLine = '%0A';
const lineAndColumnInStackTrace = /^.*?:([0-9]+):([0-9]+).*$/;

class GithubActionsReporter {
	async onRunComplete( _contexts, _aggregatedResults ) {
		if ( ! process.env.GITHUB_ACTIONS ) {
			return;
		}

		if ( ! _aggregatedResults ) {
			return;
		}
		const messages = getMessages( _aggregatedResults.testResults );

		for ( const message of messages ) {
			// eslint-disable-next-line no-console
			console.log( message );
		}
	}
}

function getMessages( results ) {
	if ( ! results ) {
		return [];
	}

	return results.reduce(
		flatMap( ( { testFilePath, testResults } ) =>
			testResults
				.filter( ( r ) => r.status === 'failed' )
				.reduce(
					flatMap( ( r ) => r.failureMessages ),
					[]
				)
				.map( ( m ) => m.replace( newLine, encodedNewLine ) )
				.map( ( m ) => lineAndColumnInStackTrace.exec( m ) )
				.filter( ( m ) => m !== null )
				.map(
					( [ message, line, col ] ) =>
						`::error file=${ testFilePath },line=${ line },col=${ col }::${ message }`
				)
		),
		[]
	);
}

function flatMap( fn ) {
	return ( out, entry ) => out.concat( ...fn( entry ) );
}

module.exports = GithubActionsReporter;
