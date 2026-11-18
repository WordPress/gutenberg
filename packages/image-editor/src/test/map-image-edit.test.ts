import { describe, expect, it } from 'vitest';
import { mapImageEdit } from '../map-image-edit';

const handlers = {
	flip: () => 'flip',
	rotation: () => 'rotation',
	crop: () => 'crop',
};

describe( 'mapImageEdit', () => {
	it( 'calls the handlers in the order the parts apply, whatever the key order', () => {
		const edit = {
			crop: { x: 0, y: 0, width: 0.5, height: 1 },
			rotation: 90,
			flip: { horizontal: true, vertical: false },
		};

		expect( mapImageEdit( edit, handlers ) ).toEqual( [
			'flip',
			'rotation',
			'crop',
		] );
	} );

	it( 'skips the parts the edit does not have', () => {
		expect( mapImageEdit( { rotation: 180 }, handlers ) ).toEqual( [
			'rotation',
		] );
		expect( mapImageEdit( {}, handlers ) ).toEqual( [] );
	} );

	it( 'passes each part to its handler', () => {
		const flip = { horizontal: false, vertical: true };
		const crop = { x: 0.25, y: 0, width: 0.5, height: 1 };

		expect(
			mapImageEdit< unknown >(
				{ flip, rotation: 270, crop },
				{
					flip: ( value ) => value,
					rotation: ( value ) => value,
					crop: ( value ) => value,
				}
			)
		).toEqual( [ flip, 270, crop ] );
	} );
} );
