/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const newLine = /\n/g;
const encodedNewLine = '%0A';
const lineAndColumnInStackTrace = /^.*?:([0-9]+):([0-9]+).*$/;

class GithubActionReporter {
	async onRunComplete( _contexts, _aggregatedResults ) {
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
	if ( ! results ) return [];

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
				//.filter((m): m is RegExpExecArray => m !== null)
				.map(
					( [ message, line, col ] ) =>
						`::error file=${ testFilePath.replace(
							process.env.GITHUB_WORKSPACE + '/',
							''
						) },line=${ line },col=${ col }::${ message }`
				)
		),
		[]
	);
}

function flatMap( fn ) {
	return ( out, entry ) => out.concat( ...fn( entry ) );
}

module.exports = GithubActionReporter;
