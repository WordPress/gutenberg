import { toSubjectArea } from '../subject';
import type { Detection } from '../types';

const face = (
	x: number,
	y: number,
	size: number,
	confidence: number
): Detection => ( { x, y, width: size, height: size, confidence } );

describe( 'toSubjectArea', () => {
	it( 'returns nothing when no detection clears the threshold', () => {
		expect(
			toSubjectArea( [ face( 0.1, 0.1, 0.1, 0.5 ) ], 0.7 )
		).toBeNull();
	} );

	it( 'returns nothing when there were no detections at all', () => {
		expect( toSubjectArea( [], 0.7 ) ).toBeNull();
	} );

	it( 'reports the highest score as the confidence', () => {
		const subject = toSubjectArea(
			[ face( 0.1, 0.1, 0.2, 0.8 ), face( 0.5, 0.1, 0.2, 0.95 ) ],
			0.7
		);

		expect( subject?.confidence ).toBe( 0.95 );
	} );

	it( 'covers every significant face', () => {
		const subject = toSubjectArea(
			[ face( 0.1, 0.2, 0.2, 0.9 ), face( 0.5, 0.3, 0.2, 0.9 ) ],
			0.7
		);

		expect( subject ).toMatchObject( {
			x: 0.1,
			y: 0.2,
			width: 0.6,
			height: 0.3,
		} );
	} );

	it( 'ignores a face far smaller than the rest', () => {
		// A distant bystander should not drag the area across the frame.
		const subject = toSubjectArea(
			[ face( 0.4, 0.4, 0.2, 0.9 ), face( 0.95, 0.95, 0.02, 0.9 ) ],
			0.7
		);

		expect( subject ).toMatchObject( { x: 0.4, y: 0.4 } );
		expect( subject?.detections ).toHaveLength( 1 );
	} );
} );
