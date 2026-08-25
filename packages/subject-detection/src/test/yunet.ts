import {
	decodeDetections,
	getLetterbox,
	imageDataToTensor,
	nonMaximumSuppression,
	toNormalizedDetections,
	type YuNetOutputs,
} from '../yunet';

describe( 'getLetterbox', () => {
	it( 'centres a landscape image in the square', () => {
		expect( getLetterbox( 1000, 500, 640 ) ).toEqual( {
			scale: 0.64,
			width: 640,
			height: 320,
			left: 0,
			top: 160,
		} );
	} );

	it( 'centres a portrait image in the square', () => {
		expect( getLetterbox( 500, 1000, 640 ) ).toEqual( {
			scale: 0.64,
			width: 320,
			height: 640,
			left: 160,
			top: 0,
		} );
	} );

	it( 'does not distort a square image', () => {
		const { width, height } = getLetterbox( 900, 900, 640 );

		expect( width ).toBe( height );
	} );
} );

describe( 'imageDataToTensor', () => {
	it( 'writes planar BGR, which is the order the model was trained on', () => {
		// A 2x2 square: red, green, blue, white.
		const pixels = new Uint8ClampedArray( [
			255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
		] );

		const tensor = imageDataToTensor( pixels, 2 );
		const plane = 4;

		expect( Array.from( tensor.slice( 0, plane ) ) ).toEqual( [
			0, 0, 255, 255,
		] );
		expect( Array.from( tensor.slice( plane, 2 * plane ) ) ).toEqual( [
			0, 255, 0, 255,
		] );
		expect( Array.from( tensor.slice( 2 * plane ) ) ).toEqual( [
			255, 0, 0, 255,
		] );
	} );
} );

describe( 'decodeDetections', () => {
	/**
	 * Builds outputs for a 16px square at a single stride, with one cell set.
	 *
	 * @param cell   Index of the cell to score.
	 * @param scores The classification and objectness scores for it.
	 * @param box    Centre offsets and log sizes for it.
	 * @return Outputs shaped the way the model returns them.
	 */
	function outputsWithOneCell(
		cell: number,
		scores: [ number, number ],
		box: [ number, number, number, number ]
	): YuNetOutputs {
		const cells = 4; // 16 / stride 4 would be 4, but strides are fixed, so
		const size = 8 * 2; // use stride 8 over a 16px square: 2x2 = 4 cells.
		const count = ( size / 8 ) * ( size / 8 );
		const cls = new Float32Array( count );
		const obj = new Float32Array( count );
		const bbox = new Float32Array( count * 4 );
		cls[ cell ] = scores[ 0 ];
		obj[ cell ] = scores[ 1 ];
		bbox.set( box, cell * 4 );
		expect( count ).toBe( cells );
		return { cls_8: cls, obj_8: obj, bbox_8: bbox };
	}

	it( 'scores a cell as the geometric mean of its two scores', () => {
		const outputs = outputsWithOneCell( 0, [ 1, 1 ], [ 0.5, 0.5, 0, 0 ] );

		const [ detection ] = decodeDetections( outputs, 16, 0.5 );

		expect( detection.confidence ).toBe( 1 );
	} );

	it( 'drops cells that score below the threshold', () => {
		const outputs = outputsWithOneCell(
			0,
			[ 0.5, 0.5 ],
			[ 0.5, 0.5, 0, 0 ]
		);

		expect( decodeDetections( outputs, 16, 0.7 ) ).toHaveLength( 0 );
	} );

	it( 'places a box from its cell, offset and log size', () => {
		// Cell 3 of a 2x2 grid at stride 8 is column 1, row 1.
		const outputs = outputsWithOneCell( 3, [ 1, 1 ], [ 0.5, 0.5, 0, 0 ] );

		const [ detection ] = decodeDetections( outputs, 16, 0.5 );

		// Centre is (1 + 0.5) * 8 = 12, size is exp(0) * 8 = 8.
		expect( detection.left ).toBe( 8 );
		expect( detection.top ).toBe( 8 );
		expect( detection.width ).toBe( 8 );
		expect( detection.height ).toBe( 8 );
	} );

	it( 'ignores strides the model did not return', () => {
		const outputs = outputsWithOneCell( 0, [ 1, 1 ], [ 0.5, 0.5, 0, 0 ] );

		expect( () => decodeDetections( outputs, 16, 0.5 ) ).not.toThrow();
	} );
} );

describe( 'nonMaximumSuppression', () => {
	const box = ( left: number, confidence: number ) => ( {
		left,
		top: 0,
		width: 10,
		height: 10,
		confidence,
	} );

	it( 'keeps the highest scoring box out of a cluster', () => {
		const kept = nonMaximumSuppression( [
			box( 0, 0.8 ),
			box( 1, 0.9 ),
			box( 2, 0.7 ),
		] );

		expect( kept ).toHaveLength( 1 );
		expect( kept[ 0 ].confidence ).toBe( 0.9 );
	} );

	it( 'keeps boxes that do not overlap', () => {
		expect(
			nonMaximumSuppression( [ box( 0, 0.9 ), box( 100, 0.8 ) ] )
		).toHaveLength( 2 );
	} );
} );

describe( 'toNormalizedDetections', () => {
	it( 'maps a box out of the letterbox and onto the source image', () => {
		const letterbox = getLetterbox( 1000, 500, 640 );

		// The middle of the square, which is the middle of the image.
		const [ detection ] = toNormalizedDetections(
			[
				{
					left: 320 - 32,
					top: 320 - 16,
					width: 64,
					height: 32,
					confidence: 0.9,
				},
			],
			letterbox
		);

		expect( detection.x ).toBeCloseTo( 0.45 );
		expect( detection.y ).toBeCloseTo( 0.45 );
		expect( detection.width ).toBeCloseTo( 0.1 );
		expect( detection.height ).toBeCloseTo( 0.1 );
	} );

	it( 'clamps a box that the model predicted past the edge', () => {
		const letterbox = getLetterbox( 640, 640, 640 );

		const [ detection ] = toNormalizedDetections(
			[
				{
					left: -50,
					top: -50,
					width: 100,
					height: 100,
					confidence: 0.9,
				},
			],
			letterbox
		);

		expect( detection.x ).toBe( 0 );
		expect( detection.y ).toBe( 0 );
		expect( detection.width ).toBeCloseTo( 50 / 640 );
	} );
} );
