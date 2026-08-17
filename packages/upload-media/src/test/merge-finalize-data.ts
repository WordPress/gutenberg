import { mergeFinalizeDataRecords } from '../merge-finalize-data';

describe( 'mergeFinalizeDataRecords', () => {
	it( 'accumulates nested plain objects', () => {
		expect(
			mergeFinalizeDataRecords(
				{ encode_quality: { thumbnail: 0.55 } },
				{ encode_quality: { medium: 0.7 } }
			)
		).toEqual( {
			encode_quality: {
				thumbnail: 0.55,
				medium: 0.7,
			},
		} );
	} );

	it( 'lets scalars and arrays replace previous values', () => {
		expect(
			mergeFinalizeDataRecords(
				{ n: 1, list: [ 'a' ], nested: { keep: true } },
				{ n: 2, list: [ 'b' ], nested: { add: true } }
			)
		).toEqual( {
			n: 2,
			list: [ 'b' ],
			nested: { keep: true, add: true },
		} );
	} );
} );
