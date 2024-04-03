/**
 * Internal dependencies
 */
import {
	getBlockPaddings,
	getBlockColors,
	parseStylesVariables,
	getGlobalStyles,
} from '../utils';

import {
	DEFAULT_COLORS,
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

describe( 'parseStylesVariables', () => {
	it( 'returns the parsed preset values correctly', () => {
		const customValues = parseStylesVariables(
			JSON.stringify( RAW_FEATURES.custom ),
			MAPPED_VALUES
		);
		const blockColors = parseStylesVariables(
			JSON.stringify( DEFAULT_GLOBAL_STYLES ),
			MAPPED_VALUES,
			customValues
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( PARSED_GLOBAL_STYLES )
		);
	} );

	it( 'returns the parsed custom color values correctly', () => {
		const defaultStyles = {
			...DEFAULT_GLOBAL_STYLES,
			color: {
				text: 'var(--wp--custom--color--blue)',
				background: 'var(--wp--custom--color--green)',
			},
		};
		const customValues = parseStylesVariables(
			JSON.stringify( RAW_FEATURES.custom ),
			MAPPED_VALUES
		);
		const styles = parseStylesVariables(
			JSON.stringify( defaultStyles ),
			MAPPED_VALUES,
			customValues
		);
		expect( styles ).toEqual(
			expect.objectContaining( PARSED_GLOBAL_STYLES )
		);
	} );
} );

describe( 'getGlobalStyles', () => {
	it( 'returns the global styles data correctly', () => {
		const rawFeatures = JSON.stringify( RAW_FEATURES );
		const gradients = parseStylesVariables(
			JSON.stringify( GLOBAL_STYLES_GRADIENTS ),
			MAPPED_VALUES
		);

		const globalStyles = getGlobalStyles(
			JSON.stringify( DEFAULT_GLOBAL_STYLES ),
			rawFeatures
		);

		expect( globalStyles ).toEqual(
			expect.objectContaining( {
				__experimentalFeatures: {
					color: {
						palette: RAW_FEATURES.color.palette,
						gradients,
						text: true,
						background: true,
						defaultPalette: true,
						defaultGradients: true,
					},
					typography: {
						fontSizes: RAW_FEATURES.typography.fontSizes,
						customLineHeight: RAW_FEATURES.custom[ 'line-height' ],
					},
				},
				__experimentalGlobalStylesBaseStyles: PARSED_GLOBAL_STYLES,
			} )
		);
	} );
} );
