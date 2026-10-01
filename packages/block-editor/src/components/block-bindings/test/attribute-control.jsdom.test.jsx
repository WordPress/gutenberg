import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getBlockBindingsSource } from '@wordpress/blocks';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import BlockContext from '../../block-context';
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
	label: 'SEO title',
	type: 'string',
};
const source = {
	canUserEditValue: vi.fn(),
	getValues: vi.fn(),
	label: 'Post meta',
	usesContext: [ 'postId' ],
};

function renderControl( binding ) {
	useViewportMatch.mockReturnValue( false );
	getBlockBindingsSource.mockReturnValue( source );
	useBlockBindingsUtils.mockReturnValue( { updateBlockBindings } );
	useSelect.mockImplementation( ( mapSelect, dependencies ) => {
		// The read-only check is the only selector depending on the source.
		if ( dependencies?.[ 1 ] === source ) {
			return mapSelect( () => ( {} ) );
		}
		if ( dependencies?.length === 3 ) {
			return { 'core/post-meta': [ field ] };
		}
		if ( dependencies?.length === 4 ) {
			return {};
		}
		return { canUpdateBlockBindings: true };
	} );

	return render(
		<BlockContext.Provider value={ { postId: 123, postType: 'post' } }>
			<BlockBindingsAttributeControl
				attribute="content"
				binding={ binding }
				blockName="core/paragraph"
			/>
		</BlockContext.Provider>
	);
}

async function openFieldMenu( user ) {
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
		source.canUserEditValue.mockReset();
		source.canUserEditValue.mockReturnValue( true );
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

	describe( 'read-only note', () => {
		const binding = { source: 'core/post-meta', args: field.args };

		it( 'shows a read-only note when the source does not allow editing the value', () => {
			source.canUserEditValue.mockReturnValue( false );
			renderControl( binding );

			expect( screen.getByText( 'Read-only' ) ).toBeVisible();
		} );

		it( 'asks the source with the arguments and context it declared', () => {
			renderControl( binding );

			expect( source.canUserEditValue ).toHaveBeenCalledWith(
				expect.objectContaining( {
					args: field.args,
					context: { postId: 123 },
				} )
			);
		} );

		it( 'does not show the note when the source allows editing the value', () => {
			renderControl( binding );

			expect( screen.queryByText( 'Read-only' ) ).not.toBeInTheDocument();
		} );

		it( 'does not show the note when the attribute is not connected', () => {
			source.canUserEditValue.mockReturnValue( false );
			renderControl();

			expect( screen.queryByText( 'Read-only' ) ).not.toBeInTheDocument();
		} );
	} );
} );
