import { render as baseRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotFillProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import Link, {
	getLinkSettings,
	getUpdatedLinkAttributes,
	NEW_TAB_TARGET,
} from '../link';

const mockFetchSearchSuggestions = vi.fn( () => Promise.resolve( [] ) );

// Mock the hook module itself so the returned value can be tweaked per test.
vi.mock( '@wordpress/data/src/components/use-select', () => ( {
	default: vi.fn(),
} ) );
useSelect.mockImplementation( () => ( {
	fetchSearchSuggestions: mockFetchSearchSuggestions,
	fetchRichUrlData: undefined,
} ) );

vi.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: () => ( { saveEntityRecords: vi.fn() } ),
} ) );

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useReducedMotion: vi.fn( () => true ),
} ) );

beforeAll( () => {
	// The link settings drawer reads `window.matchMedia`, which JSDOM lacks.
	vi.stubGlobal(
		'matchMedia',
		vi.fn( ( query ) => ( {
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		} ) )
	);
} );

afterAll( () => {
	vi.unstubAllGlobals();
} );

function render( ui ) {
	return baseRender( ui, { wrapper: SlotFillProvider } );
}

const linkField = {
	id: 'link',
	label: 'Link',
	getValue: ( { item } ) => ( {
		url: item.url,
		rel: item.rel,
		linkTarget: item.linkTarget,
	} ),
	setValue: ( { value } ) => ( {
		url: value.url,
		rel: value.rel,
		linkTarget: value.linkTarget,
	} ),
};

async function openLinkSettingsDrawer( user ) {
	await user.click( screen.getByRole( 'button', { name: 'Link' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Edit link' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
}

describe( 'getUpdatedLinkAttributes', () => {
	it( 'adds the new tab target and rel when opening in a new tab', () => {
		expect(
			getUpdatedLinkAttributes( {
				url: 'https://example.com',
				opensInNewTab: true,
				nofollow: false,
			} )
		).toEqual( {
			url: 'https://example.com',
			linkTarget: NEW_TAB_TARGET,
			rel: 'noopener',
		} );
	} );

	it( 'keeps combined rel tokens intact when both settings are enabled', () => {
		expect(
			getUpdatedLinkAttributes( {
				url: 'https://example.com',
				rel: 'noopener nofollow',
				opensInNewTab: true,
				nofollow: true,
			} )
		).toEqual( {
			url: 'https://example.com',
			linkTarget: NEW_TAB_TARGET,
			rel: 'noopener nofollow',
		} );
	} );

	it( 'removes only the managed tokens when settings are disabled', () => {
		expect(
			getUpdatedLinkAttributes( {
				url: 'https://example.com',
				rel: 'noopener nofollow sponsored',
				opensInNewTab: false,
				nofollow: false,
			} )
		).toEqual( {
			url: 'https://example.com',
			linkTarget: undefined,
			rel: 'sponsored',
		} );
	} );

	it( 'preserves custom rel tokens when adding nofollow', () => {
		expect(
			getUpdatedLinkAttributes( {
				url: 'https://example.com',
				rel: 'sponsored',
				opensInNewTab: false,
				nofollow: true,
			} )
		).toEqual( {
			url: 'https://example.com',
			linkTarget: undefined,
			rel: 'sponsored nofollow',
		} );
	} );

	it( 'prepends the protocol to bare domains', () => {
		expect( getUpdatedLinkAttributes( { url: 'example.com' } ).url ).toBe(
			'http://example.com'
		);
	} );

	it( 'returns an undefined rel when no tokens remain', () => {
		expect(
			getUpdatedLinkAttributes( { url: 'https://example.com' } ).rel
		).toBeUndefined();
	} );
} );

describe( 'getLinkSettings', () => {
	it( 'resolves known setting ids in a stable order', () => {
		expect( getLinkSettings( [ 'nofollow', 'opensInNewTab' ] ) ).toEqual( [
			{ id: 'opensInNewTab', title: 'Open in new tab' },
			{ id: 'nofollow', title: 'Mark as nofollow' },
		] );
	} );

	it( 'ignores unknown setting ids', () => {
		expect( getLinkSettings( [ 'sponsored', 'nofollow' ] ) ).toEqual( [
			{ id: 'nofollow', title: 'Mark as nofollow' },
		] );
	} );
} );

describe( 'Link field control', () => {
	it( 'renders the field label and the current URL', () => {
		render(
			createElement( Link, {
				data: { url: 'https://example.com' },
				field: linkField,
				onChange: vi.fn(),
			} )
		);

		expect( screen.getByRole( 'button', { name: 'Link' } ) ).toBeVisible();
		expect( screen.getByText( 'https://example.com' ) ).toBeVisible();
	} );

	it( 'offers only the default link settings when the field declares none', async () => {
		const user = userEvent.setup();

		render(
			createElement( Link, {
				data: {
					url: 'https://example.com',
					rel: 'noopener',
					linkTarget: NEW_TAB_TARGET,
				},
				field: linkField,
				onChange: vi.fn(),
			} )
		);

		await openLinkSettingsDrawer( user );

		expect( screen.getAllByRole( 'checkbox' ) ).toHaveLength( 1 );
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Open in new tab',
				checked: true,
			} )
		).toBeVisible();
	} );

	it( 'offers the settings declared by the field, reading their state from combined rel values', async () => {
		const user = userEvent.setup();

		render(
			createElement( Link, {
				data: {
					url: 'https://example.com',
					rel: 'noopener nofollow',
					linkTarget: NEW_TAB_TARGET,
				},
				field: linkField,
				onChange: vi.fn(),
				config: {
					settings: [ 'opensInNewTab', 'nofollow' ],
				},
			} )
		);

		await openLinkSettingsDrawer( user );

		expect( screen.getAllByRole( 'checkbox' ) ).toHaveLength( 2 );
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Open in new tab',
				checked: true,
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'checkbox', {
				name: 'Mark as nofollow',
				checked: true,
			} )
		).toBeVisible();
	} );
} );
