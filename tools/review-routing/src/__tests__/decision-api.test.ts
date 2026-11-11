import { describe, expect, it } from 'vitest';
import { buildRequest, readAnswers, readProbability } from '../decision-api.ts';
import { decide } from '../report.ts';

const RULE = {
	id: 'design-system',
	reviewer: 'WordPress/gutenberg-components',
	threshold: 0.7,
	instructions: 'Ask when UI changes.',
};

describe( 'buildRequest', () => {
	it( 'asks one yes or no question for each rule', () => {
		expect( buildRequest( 'state', [ RULE ], 'jev' ) ).toEqual( {
			model: 'jev',
			state: 'state',
			questions: {
				'design-system': {
					type: 'noul',
					instructions: 'Ask when UI changes.',
				},
			},
		} );
	} );
} );

describe( 'readProbability', () => {
	it( 'reads a noul answer', () => {
		expect( readProbability( 'a', { type: 'noul', noul: 0.4 } ) ).toBe(
			0.4
		);
	} );

	it.each( [ undefined, 0.4, { probability: 0.4 }, { noul: 1.5 } ] )(
		'rejects %j',
		( answer ) => {
			expect( () => readProbability( 'a', answer ) ).toThrow();
		}
	);
} );

describe( 'readAnswers', () => {
	const answers = { a: { type: 'noul', noul: 0.4 } };

	it( 'reads a plain response', () => {
		expect( readAnswers( { model: 'jev', answers } ) ).toEqual( answers );
	} );

	it( 'unwraps a Cloudflare envelope', () => {
		expect( readAnswers( { success: true, result: { answers } } ) ).toEqual(
			answers
		);
	} );

	it( 'fails on an unsuccessful Cloudflare envelope', () => {
		expect( () =>
			readAnswers( { success: false, errors: [ { code: 7000 } ] } )
		).toThrow( '7000' );
	} );
} );

describe( 'decide', () => {
	it( 'requests review when the probability reaches the threshold', () => {
		expect(
			decide( [ RULE ], { 'design-system': 0.7 } )[ 0 ].requestReview
		).toBe( true );
		expect(
			decide( [ RULE ], { 'design-system': 0.69 } )[ 0 ].requestReview
		).toBe( false );
	} );
} );
