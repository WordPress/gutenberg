/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import tableNormaliser from '../table-normaliser';
import { deepFilterHTML } from '../utils';

describe( 'tableNormaliser', () => {
	it( 'should remove invalid text nodes in table', () => {
		equal(
			deepFilterHTML( '\n<table>\n<tbody>\n<tr>\n<td>\n</td>\n</tr>\n</tbody>\n</table>\n', [ tableNormaliser ] ),
			'\n<table><tbody><tr><td>\n</td></tr></tbody></table>\n'
		);
	} );
} );
