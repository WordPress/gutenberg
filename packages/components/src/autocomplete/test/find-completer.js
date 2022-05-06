/**
 * Internal dependencies
 */
import findCompleter from '../find-completer';

const completers = [
	{
		triggerPrefix: '@',
	},
];

describe( 'findCompleter', () => {
	it( 'should return undefined when no prefix matches with triggerPrefix', () => {
		expect(
			findCompleter( {
				text: 'everything is fine',
				textAfterSelection: '',
				completers,
				filteredOptions: [],
				backspacing: false,
			} )
		).toBeUndefined();
	} );
	it( 'should return a completer when a prefix matches with triggerPrefix', () => {
		expect(
			findCompleter( {
				text: 'everything is fine @',
				textAfterSelection: '',
				completers,
				filteredOptions: [ 'admin' ],
				backspacing: false,
			} )
		).toBeDefined();
	} );
} );
