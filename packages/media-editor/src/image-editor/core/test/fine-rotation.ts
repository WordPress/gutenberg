import { fineRotation } from '../fine-rotation';

const NO_FLIP = { horizontal: false, vertical: false };
const HORIZONTAL_FLIP = { horizontal: true, vertical: false };

describe( 'fineRotation', () => {
	it( 'stores a safe value at the positive boundary and reads it as the advertised endpoint', () => {
		const rotation = fineRotation.absoluteFromOffset(
			0,
			NO_FLIP,
			fineRotation.max
		);

		expect( rotation ).toBe( 44.99 );
		expect( fineRotation.offsetFromState( rotation, NO_FLIP ) ).toBe(
			fineRotation.max
		);
	} );

	it( 'stores a safe value at the negative boundary and reads it as the advertised endpoint', () => {
		const rotation = fineRotation.absoluteFromOffset(
			0,
			NO_FLIP,
			fineRotation.min
		);

		expect( rotation ).toBe( -44.99 );
		expect( fineRotation.offsetFromState( rotation, NO_FLIP ) ).toBe(
			fineRotation.min
		);
	} );

	it( 'normalizes boundary offsets through flipped visual direction', () => {
		const rotation = fineRotation.absoluteFromOffset(
			0,
			HORIZONTAL_FLIP,
			fineRotation.max
		);

		expect( rotation ).toBe( -44.99 );
		expect(
			fineRotation.offsetFromState( rotation, HORIZONTAL_FLIP )
		).toBe( fineRotation.max );
	} );
} );
