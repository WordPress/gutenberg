import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getBlockBindingsSource } from '@wordpress/blocks';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import type { ReactNode } from 'react';
import type { Mock } from 'vitest';
import type { UserEvent } from '@testing-library/user-event';
import useBlockBindingsUtils from '../use-block-bindings-utils';
import BlockBindingsAttributeControl from '../attribute-control';
import type { Binding } from '../../../utils/block-bindings';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockPointerEvent();
globalThis.wpVitest.mockScrollIntoView();

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	getBlockBindingsSource: vi.fn(),
} ) );
vi.mock( import( '@wordpress/components' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// The stub renders the item's children only.
	__experimentalToolsPanelItem: ( ( {
		children,
	}: {
		children?: ReactNode;
	} ) =>
		children ) as unknown as typeof import( '@wordpress/components' ).__experimentalToolsPanelItem,
} ) );
vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// The hook's type carries more than the mock function.
	useViewportMatch: vi.fn() as unknown as typeof useViewportMatch,
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
	label: 'SEO title',
	type: 'string',
};
const source = {
	getValues: vi.fn(),
	label: 'Post meta',
};

function renderControl( binding?: Binding ) {
	// The modules above are mocked with `vi.fn()`.
	( useViewportMatch as unknown as Mock ).mockReturnValue( false );
	( getBlockBindingsSource as Mock ).mockReturnValue( source );
	( useBlockBindingsUtils as Mock ).mockReturnValue( {
		updateBlockBindings,
	} );
	( useSelect as Mock ).mockImplementation(
		( _mapSelect: unknown, dependencies?: unknown[] ) => {
			if ( dependencies?.length === 3 ) {
				return { 'core/post-meta': [ field ] };
			}
			if ( dependencies?.length === 4 ) {
				return {};
			}
			return { canUpdateBlockBindings: true };
		}
	);

	return render(
		<BlockBindingsAttributeControl
			attribute="content"
			binding={ binding }
			blockName="core/paragraph"
		/>
	);
}

async function openFieldMenu( user: UserEvent ) {
	await user.click( screen.getByRole( 'button', { name: /content/i } ) );
	const sourceItem = await screen.findByRole( 'menuitem', {
		name: 'Post meta',
	} );
	await user.click( sourceItem );
	const fieldItem = await screen.findByRole( 'menuitemcheckbox', {
		name: 'SEO title',
	} );
	return fieldItem;
}

describe( 'BlockBindingsAttributeControl', () => {
	beforeEach( () => {
		updateBlockBindings.mockReset();
	} );

	it( 'selects a source field', async () => {
		const user = userEvent.setup();
		renderControl();

		const fieldItem = await openFieldMenu( user );
		fireEvent.click( fieldItem );

		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: {
				source: 'core/post-meta',
				args: field.args,
			},
		} );
	} );

	it( 'clears the selected source field', async () => {
		const user = userEvent.setup();
		renderControl( {
			source: 'core/post-meta',
			args: field.args,
		} );

		const fieldItem = await openFieldMenu( user );
		fireEvent.click( fieldItem );

		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: undefined,
		} );
	} );
} );
