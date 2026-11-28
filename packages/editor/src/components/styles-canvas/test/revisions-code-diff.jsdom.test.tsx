import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import StylesRevisionsCodeDiff, {
	getStylesRevisionCode,
} from '../revisions-code-diff';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'getStylesRevisionCode', () => {
	it( 'leaves out revision metadata', () => {
		const code = getStylesRevisionCode( {
			id: 12,
			author: { name: 'Admin' },
			modified: '2026-01-01T00:00:00',
			_links: { self: [] },
			styles: { color: { text: 'red' } },
			settings: {},
		} as Parameters< typeof getStylesRevisionCode >[ 0 ] );

		expect( JSON.parse( code ) ).toEqual( {
			settings: {},
			styles: { color: { text: 'red' } },
		} );
	} );

	it( 'serializes the same content the same whatever the key order', () => {
		expect(
			getStylesRevisionCode( {
				styles: { color: { text: 'red', background: 'blue' } },
				settings: { layout: { contentSize: '600px' } },
			} )
		).toBe(
			getStylesRevisionCode( {
				settings: { layout: { contentSize: '600px' } },
				styles: { color: { background: 'blue', text: 'red' } },
			} )
		);
	} );

	it( 'keeps the order of array entries', () => {
		const code = getStylesRevisionCode( {
			settings: {
				color: {
					palette: {
						custom: [
							{ name: 'Black', slug: 'b', color: '#000' },
							{ name: 'White', slug: 'a', color: '#fff' },
						],
					},
				},
			},
		} );

		expect(
			JSON.parse( code ).settings.color.palette.custom.map(
				( { slug }: { slug: string } ) => slug
			)
		).toEqual( [ 'b', 'a' ] );
	} );

	it( 'treats missing styles and settings as empty', () => {
		expect( JSON.parse( getStylesRevisionCode( null ) ) ).toEqual( {
			settings: {},
			styles: {},
		} );
	} );
} );

describe( 'StylesRevisionsCodeDiff', () => {
	it( 'shows the revision value removed next to the current value added', () => {
		render(
			<StylesRevisionsCodeDiff
				revision={ { styles: { color: { background: 'blue' } } } }
				currentConfig={ { styles: { color: { background: 'red' } } } }
			/>
		);

		expect(
			screen.getByRole( 'region', {
				name: 'Changes since this revision',
			} )
		).toBeVisible();

		// The changed line pairs up in one row: the revision on the start
		// side, the current styles on the end side.
		const row = screen.getByRole( 'row', {
			name: /Removed.*"background": "blue".*Added.*"background": "red"/,
		} );
		expect(
			within( row ).getByRole( 'cell', { name: /"background": "blue"/ } )
		).toHaveClass( 'is-removed' );
		expect(
			within( row ).getByRole( 'cell', { name: /"background": "red"/ } )
		).toHaveClass( 'is-added' );
	} );

	it( 'says so when the revision matches the current styles', () => {
		render(
			<StylesRevisionsCodeDiff
				revision={ {
					styles: { color: { text: 'red', background: 'blue' } },
				} }
				currentConfig={ {
					styles: { color: { background: 'blue', text: 'red' } },
				} }
			/>
		);

		expect(
			screen.getByText( 'This revision matches the current styles.' )
		).toBeVisible();
		expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
	} );

	it( 'asks for a revision when there is none to compare', () => {
		render(
			<StylesRevisionsCodeDiff
				revision={ null }
				currentConfig={ { styles: { color: { text: 'red' } } } }
			/>
		);

		expect(
			screen.getByText(
				'Select a revision to compare it with the current styles.'
			)
		).toBeVisible();
	} );
} );
