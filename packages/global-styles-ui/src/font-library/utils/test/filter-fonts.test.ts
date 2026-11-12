import { describe, expect, it } from 'vitest';
import filterFonts from '../filter-fonts';

const fonts = [
	{
		id: 'roboto',
		font_family_settings: {
			name: 'Roboto',
			slug: 'roboto',
			fontFamily: 'Roboto, sans-serif',
		},
	},
	{
		id: 'lora',
		font_family_settings: {
			name: 'Lora',
			slug: 'lora',
			fontFamily: 'Lora, serif',
		},
	},
];

describe( 'filterFonts', () => {
	it( 'ignores leading and trailing spaces in the search term', () => {
		expect( filterFonts( fonts, { search: ' Roboto ' } ) ).toEqual( [
			fonts[ 0 ],
		] );
	} );
} );
