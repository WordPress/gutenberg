import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotFillProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useReducedMotion } from '@wordpress/compose';
import LinkControl from '../';
import { fetchFauxEntitySuggestions } from './fixtures';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const mockFetchSearchSuggestions = vi.fn();

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useDispatch: () => ( { saveEntityRecords: vi.fn() } ),
	useSelect: vi.fn(),
} ) );

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useReducedMotion: vi.fn( () => true ),
} ) );

beforeEach( () => {
	useReducedMotion.mockReturnValue( true );
	useSelect.mockImplementation( () => ( {
		fetchSearchSuggestions: mockFetchSearchSuggestions,
	} ) );
	mockFetchSearchSuggestions.mockImplementation( fetchFauxEntitySuggestions );
} );

afterEach( () => {
	mockFetchSearchSuggestions.mockReset();
} );

function renderWithProvider( ui ) {
	return render( ui, { wrapper: SlotFillProvider } );
}

describe( 'URL normalization consistency', () => {
	it( 'should normalize bare domain (wordpress.org) to https:// when clicking Apply', async () => {
		const user = userEvent.setup();
		const mockOnChange = vi.fn();

		// Start with existing link to show Apply button
		renderWithProvider(
			<LinkControl
				value={ { url: 'https://example.com' } }
				forceIsEditingLink
				onChange={ mockOnChange }
			/>
		);

		const searchInput = screen.getByRole( 'combobox' );
		await user.clear( searchInput );
		await user.type( searchInput, 'wordpress.org' );

		// Wait for suggestion to appear
		await screen.findByRole( 'option' );

		// Click Apply button (not Enter key, not selecting suggestion)
		const applyButton = screen.getByRole( 'button', {
			name: 'Apply',
		} );
		await user.click( applyButton );

		await waitFor( () => {
			expect( mockOnChange ).toHaveBeenCalled();
		} );

		// Should normalize to https://wordpress.org
		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				url: 'https://wordpress.org',
			} )
		);
	} );

	it( 'should normalize www domain (www.wordpress.org) to https:// when clicking Apply', async () => {
		const user = userEvent.setup();
		const mockOnChange = vi.fn();

		// Start with existing link to show Apply button
		renderWithProvider(
			<LinkControl
				value={ { url: 'https://example.com' } }
				forceIsEditingLink
				onChange={ mockOnChange }
			/>
		);

		const searchInput = screen.getByRole( 'combobox' );
		await user.clear( searchInput );
		await user.type( searchInput, 'www.wordpress.org' );

		// Wait for suggestion to appear
		await screen.findByRole( 'option' );

		// Click Apply button
		const applyButton = screen.getByRole( 'button', {
			name: 'Apply',
		} );
		await user.click( applyButton );

		await waitFor( () => {
			expect( mockOnChange ).toHaveBeenCalled();
		} );

		// Should normalize to https://www.wordpress.org
		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				url: 'https://www.wordpress.org',
			} )
		);
	} );

	it( 'should preserve explicit http:// protocol', async () => {
		const user = userEvent.setup();
		const mockOnChange = vi.fn();

		renderWithProvider(
			<LinkControl
				value={ { url: 'https://example.com' } }
				forceIsEditingLink
				onChange={ mockOnChange }
			/>
		);

		const searchInput = screen.getByRole( 'combobox' );
		await user.clear( searchInput );
		await user.type( searchInput, 'http://example.com' );

		await screen.findByRole( 'option' );

		const applyButton = screen.getByRole( 'button', {
			name: 'Apply',
		} );
		await user.click( applyButton );

		await waitFor( () => {
			expect( mockOnChange ).toHaveBeenCalled();
		} );

		// Should keep http://, not change to https://
		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				url: 'http://example.com',
			} )
		);
	} );

	it( 'should preserve mailto: links without normalization', async () => {
		const user = userEvent.setup();
		const mockOnChange = vi.fn();

		renderWithProvider(
			<LinkControl
				value={ { url: 'https://example.com' } }
				forceIsEditingLink
				onChange={ mockOnChange }
			/>
		);

		const searchInput = screen.getByRole( 'combobox' );
		await user.clear( searchInput );
		await user.type( searchInput, 'mailto:test@example.com' );

		await screen.findByRole( 'option' );

		const applyButton = screen.getByRole( 'button', {
			name: 'Apply',
		} );
		await user.click( applyButton );

		await waitFor( () => {
			expect( mockOnChange ).toHaveBeenCalled();
		} );

		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				url: 'mailto:test@example.com',
			} )
		);
	} );

	it( 'should preserve relative paths without normalization', async () => {
		const user = userEvent.setup();
		const mockOnChange = vi.fn();

		renderWithProvider(
			<LinkControl
				value={ { url: 'https://example.com' } }
				forceIsEditingLink
				onChange={ mockOnChange }
			/>
		);

		const searchInput = screen.getByRole( 'combobox' );
		await user.clear( searchInput );
		await user.type( searchInput, '/about' );

		await screen.findByRole( 'option' );

		const applyButton = screen.getByRole( 'button', {
			name: 'Apply',
		} );
		await user.click( applyButton );

		await waitFor( () => {
			expect( mockOnChange ).toHaveBeenCalled();
		} );

		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				url: '/about',
			} )
		);
	} );

	it( 'should preserve hash links without normalization', async () => {
		const user = userEvent.setup();
		const mockOnChange = vi.fn();

		renderWithProvider(
			<LinkControl
				value={ { url: 'https://example.com' } }
				forceIsEditingLink
				onChange={ mockOnChange }
			/>
		);

		const searchInput = screen.getByRole( 'combobox' );
		await user.clear( searchInput );
		await user.type( searchInput, '#section' );

		await screen.findByRole( 'option' );

		const applyButton = screen.getByRole( 'button', {
			name: 'Apply',
		} );
		await user.click( applyButton );

		await waitFor( () => {
			expect( mockOnChange ).toHaveBeenCalled();
		} );

		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				url: '#section',
			} )
		);
	} );
} );
