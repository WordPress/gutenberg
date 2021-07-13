/**
 * Internal dependencies
 */
import {
	getBlockPaddings,
	getBlockColors,
	parseVariables,
	getGlobalStyles,
} from '../utils';

import {
	DEFAULT_COLORS,
	GLOBAL_STYLES_PALETTE,
	GLOBAL_STYLES_GRADIENTS,
	DEFAULT_GLOBAL_STYLES,
	PARSED_GLOBAL_STYLES,
	RAW_FEATURES,
	MAPPED_VALUES,
} from './fixtures/theme';

describe( 'getBlockPaddings', () => {
	const PADDING = 12;

	it( 'returns no paddings for a block without background color', () => {
		const paddings = getBlockPaddings(
			{ color: 'red' },
			{ backgroundColor: 'red' },
			{ textColor: 'primary' }
		);
		expect( paddings ).toEqual( expect.objectContaining( {} ) );
	} );

	it( 'returns paddings for a block with background color', () => {
		const paddings = getBlockPaddings(
			{ color: 'red' },
			{},
			{ backgroundColor: 'red', textColor: 'primary' }
		);
		expect( paddings ).toEqual(
			expect.objectContaining( { padding: PADDING } )
		);
	} );

	it( 'returns no paddings for an inner block without background color within a parent block with background color', () => {
		const paddings = getBlockPaddings(
			{ backgroundColor: 'blue', color: 'yellow', padding: PADDING },
			{},
			{ textColor: 'primary' }
		);

		expect( paddings ).toEqual(
			expect.not.objectContaining( { padding: PADDING } )
		);
	} );
} );

describe( 'getBlockColors', () => {
	it( 'returns the theme colors correctly', () => {
		const blockColors = getBlockColors(
			{ backgroundColor: 'accent', textColor: 'secondary' },
			DEFAULT_COLORS
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( {
				backgroundColor: '#cd2653',
				color: '#6d6d6d',
			} )
		);
	} );

	it( 'returns custom background color correctly', () => {
		const blockColors = getBlockColors(
			{ backgroundColor: '#222222', textColor: 'accent' },
			DEFAULT_COLORS
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( {
				backgroundColor: '#222222',
				color: '#cd2653',
			} )
		);
	} );

	it( 'returns custom text color correctly', () => {
		const blockColors = getBlockColors(
			{ textColor: '#4ddddd' },
			DEFAULT_COLORS
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( {
				color: '#4ddddd',
			} )
		);
	} );
} );

describe( 'parseVariables', () => {
	it( 'returns the parsed colors values correctly', () => {
		const blockColors = parseVariables(
			JSON.stringify( DEFAULT_GLOBAL_STYLES ),
			MAPPED_VALUES
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( PARSED_GLOBAL_STYLES )
		);
	} );
} );

describe( 'getGlobalStyles', () => {
	it( 'returns the global styles data correctly', () => {
		const rawFeatures = JSON.stringify( RAW_FEATURES );
		const globalStyles = getGlobalStyles(
			JSON.stringify( DEFAULT_GLOBAL_STYLES ),
			rawFeatures,
			GLOBAL_STYLES_PALETTE,
			GLOBAL_STYLES_GRADIENTS
		);
		const gradients = parseVariables(
			JSON.stringify( GLOBAL_STYLES_GRADIENTS ),
			MAPPED_VALUES
		);
		const parsedExperimentalFeatures = parseVariables(
			rawFeatures,
			MAPPED_VALUES
		);

		expect( globalStyles ).toEqual(
			expect.objectContaining( {
				colors: GLOBAL_STYLES_PALETTE,
				gradients,
				__experimentalFeatures: {
					color: {
						palette: parsedExperimentalFeatures?.color?.palette,
						gradients: parsedExperimentalFeatures?.color?.gradients,
					},
					typography: {
						fontSizes: RAW_FEATURES.typography.fontSizes,
						custom: {
							'line-height': RAW_FEATURES.custom[ 'line-height' ],
						},
					},
				},
				__experimentalGlobalStylesBaseStyles: PARSED_GLOBAL_STYLES,
			} )
		);
	} );
} );
