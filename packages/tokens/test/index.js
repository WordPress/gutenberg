/**
 * External dependencies
 */
import path from 'path';

/**
 * Internal dependencies
 */
import { swapTokens } from '../token-parser';
import { jsTester, phpTester } from './shared.test';

const parse = ( input ) => {
	let count = 0;
	const tokens = [];

	const tokenReplacer = ( token ) => {
		tokens.push( token );
		return `{{TOKEN_${ ++count }}}`;
	};

	const output = swapTokens( tokenReplacer, input );

	return { tokens, output };
};

describe( 'tokens', jsTester( parse ) ); // eslint-disable-line jest/valid-describe-callback

phpTester( 'token-parser-php', path.join( __dirname, 'test-parser.php' ) );
