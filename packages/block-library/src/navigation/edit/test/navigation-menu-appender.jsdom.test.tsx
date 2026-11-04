import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch, useSelect } from '@wordpress/data';
import { NavigationMenuAppender } from '../navigation-menu-appender';

globalThis.wpVitest.mockMatchMedia();

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useDispatch: vi.fn(),
	useSelect: vi.fn(),
} ) );

// Blocks aren't registered in this test, so stand in for `createBlock`.
vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	createBlock: vi.fn( ( name: string, attributes = {} ) => ( {
		name,
		attributes,
		clientId: `new-${ name }`,
		innerBlocks: [],
		isValid: true,
	} ) ),
} ) );

// The quick inserter needs a full block editor store; a button that inserts a
// block stands in for it.
vi.mock( import( '../../../lock-unlock' ), () => ( {
	lock: vi.fn(),
	unlock: < T, >() =>
		( {
			PrivateQuickInserter: ( {
				onSelect,
			}: {
				onSelect: ( block: { clientId: string } ) => void;
			} ) => (
				<button
					onClick={ () => onSelect( { clientId: 'quick-block' } ) }
				>
					Quick inserter block
				</button>
			),
		} ) as T,
} ) );

const insertBlock = vi.fn();
const setInsertedBlockClientId = vi.fn();

function setup( {
	canInsertLink = true,
	canInsertSubmenu = true,
}: { canInsertLink?: boolean; canInsertSubmenu?: boolean } = {} ) {
	( useSelect as Mock ).mockReturnValue( {
		canInsertLink,
		canInsertSubmenu,
	} );
	( useDispatch as Mock ).mockReturnValue( { insertBlock } );

	render(
		<NavigationMenuAppender
			rootClientId="navigation"
			setInsertedBlockClientId={ setInsertedBlockClientId }
		/>
	);
	return userEvent.setup();
}

describe( 'NavigationMenuAppender', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'lists the tasks for adding a menu item', async () => {
		const user = setup();
		await user.click(
			screen.getByRole( 'button', { name: 'Add menu item' } )
		);

		expect(
			screen
				.getAllByRole( 'menuitem' )
				.map( ( item ) => item.textContent )
		).toEqual( [ 'Add page', 'Custom link', 'Submenu', 'More…' ] );
	} );

	it.each( [
		[
			'Add page',
			'core/navigation-link',
			{ kind: 'post-type', type: 'page' },
		],
		[ 'Custom link', 'core/navigation-link', {} ],
		[ 'Submenu', 'core/navigation-submenu', {} ],
	] )(
		'"%s" appends a %s block and opens its link UI',
		async ( label, name, attributes ) => {
			const user = setup();
			await user.click(
				screen.getByRole( 'button', { name: 'Add menu item' } )
			);
			await user.click( screen.getByRole( 'menuitem', { name: label } ) );

			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( { name, attributes } ),
				undefined,
				'navigation',
				false
			);
			expect( setInsertedBlockClientId ).toHaveBeenCalledWith(
				`new-${ name }`
			);
		}
	);

	it( 'hides the tasks whose blocks are not allowed', async () => {
		const user = setup( { canInsertSubmenu: false } );
		await user.click(
			screen.getByRole( 'button', { name: 'Add menu item' } )
		);

		expect(
			screen.queryByRole( 'menuitem', { name: 'Submenu' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'menuitem', { name: 'Add page' } )
		).toBeInTheDocument();
	} );

	it( '"More…" opens the quick inserter and opens the link UI for the chosen block', async () => {
		const user = setup();
		await user.click(
			screen.getByRole( 'button', { name: 'Add menu item' } )
		);
		await user.click( screen.getByRole( 'menuitem', { name: 'More…' } ) );
		await user.click(
			screen.getByRole( 'button', { name: 'Quick inserter block' } )
		);

		expect( setInsertedBlockClientId ).toHaveBeenCalledWith(
			'quick-block'
		);
		expect(
			screen.queryByRole( 'button', { name: 'Quick inserter block' } )
		).not.toBeInTheDocument();
	} );
} );
