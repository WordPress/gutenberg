import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getBlockBindingsSource } from '@wordpress/blocks';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import BlockBindingsAttributeControl from '../attribute-control';
import useBlockBindingsUtils from '../use-block-bindings-utils';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockPointerEvent();
globalThis.wpVitest.mockScrollIntoView();

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	getBlockBindingsSource: vi.fn(),
} ) );
vi.mock( import( '@wordpress/components' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	__experimentalToolsPanelItem: ( { children } ) => children,
} ) );
vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useViewportMatch: vi.fn(),
} ) );
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );
vi.mock( import( '../use-block-bindings-utils' ), () => ( {
	default: vi.fn(),
} ) );

const updateBlockBindings = vi.fn();
const field = {
	args: { key: 'seo_title' },
	key: 'seo_title',
	label: 'A deliberately long SEO title field',
	type: 'string',
};
const source = {
	getValues: vi.fn(),
	label: 'Post meta',
};

function renderControl( binding ) {
	useViewportMatch.mockReturnValue( false );
	getBlockBindingsSource.mockReturnValue( source );
	useBlockBindingsUtils.mockReturnValue( { updateBlockBindings } );
	useSelect.mockImplementation( ( _mapSelect, dependencies ) => {
		if ( dependencies?.length === 3 ) {
			return { 'core/post-meta': [ field ] };
		}
		if ( dependencies?.length === 4 ) {
			return { content: 'A value supplied by post meta' };
		}
		return { canUpdateBlockBindings: true };
	} );

	return render(
		<BlockBindingsAttributeControl
			attribute="content"
			binding={ binding }
			blockName="core/paragraph"
		/>
	);
}

async function openFieldMenu( user ) {
	await user.click( screen.getByRole( 'button', { name: /content/i } ) );
	const sourceItem = await screen.findByRole( 'menuitem', {
		name: 'Post meta',
	} );
	await user.click( sourceItem );
	const fieldItem = await screen.findByRole( 'menuitemcheckbox', {
		name: 'A deliberately long SEO title field',
	} );
	await user.keyboard( '{ArrowRight}' );
	await waitFor( () => expect( fieldItem ).toHaveFocus() );
	return fieldItem;
}

describe( 'BlockBindingsAttributeControl', () => {
	beforeEach( () => {
		updateBlockBindings.mockReset();
	} );

	it( 'selects a source field and keeps its menu open', async () => {
		const user = userEvent.setup();
		renderControl();

		const fieldItem = await openFieldMenu( user );
		expect( fieldItem ).not.toBeChecked();
		expect( fieldItem ).toHaveAccessibleDescription(
			'A value supplied by post meta'
		);

		expect( fieldItem ).toHaveFocus();
		await user.keyboard( '{Enter}' );

		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: {
				source: 'core/post-meta',
				args: field.args,
			},
		} );
		expect( fieldItem ).toBeVisible();
	} );

	it( 'clears the selected source field and keeps its menu open', async () => {
		const user = userEvent.setup();
		renderControl( {
			source: 'core/post-meta',
			args: field.args,
		} );

		const fieldItem = await openFieldMenu( user );
		expect( fieldItem ).toBeChecked();

		expect( fieldItem ).toHaveFocus();
		await user.keyboard( '{Enter}' );

		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: undefined,
		} );
		expect( fieldItem ).toBeVisible();
	} );
} );
