/**
 * Internal dependencies
 */
import splitOnLineBreak from '../split-on-line-break';

describe( 'split-on-line-break', () => {
	it( 'should handle an empty set', () => {
		expect( splitOnLineBreak( [] ) ).toEqual( [ [] ] );
	} );

	it( 'should handle a set with no line breaks', () => {
		expect( splitOnLineBreak( [
			'I like',
			{ type: 'strong', props: {
				children: [ 'bold' ],
			} },
			'text',
		] ) ).toEqual( [
			[
				'I like',
				{ type: 'strong', props: {
					children: [ 'bold' ],
				} },
				'text',
			],
		] );
	} );

	it( 'should handle a set with line breaks', () => {
		expect( splitOnLineBreak( [
			'One line',
			{ type: 'br', props: {
				children: [],
			} },
			{ type: 'strong', props: {
				children: [ 'Another' ],
			} },
			'line',
		] ) ).toEqual( [
			[
				'One line',
			],
			[
				{ type: 'strong', props: {
					children: [ 'Another' ],
				} },
				'line',
			],
		] );
	} );
} );
