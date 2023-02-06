/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useHasRecursion, RecursionProvider } from '..';
import {
	BlockEditContextProvider,
	useBlockEditContext,
} from '../../block-edit/context';

// Mimics a block's Edit component, such as ReusableBlockEdit, which is capable
// of calling itself depending on its `uniqueId` attribute.
function Edit( { attributes: { uniqueId } } ) {
	const { name } = useBlockEditContext();
	const hasRecursion = useHasRecursion( uniqueId );

	if ( hasRecursion ) {
		return <div data-testid={ `wp-block__${ name }--halted` }>Halt</div>;
	}

	return (
		<RecursionProvider uniqueId={ uniqueId }>
			<div data-testid={ `wp-block__${ name }` }>
				{ uniqueId === 'SIMPLE' && <p>Done</p> }
				{ uniqueId === 'SINGLY-RECURSIVE' && (
					<Edit attributes={ { uniqueId } } />
				) }
				{ uniqueId === 'ANOTHER-BLOCK-SAME-ID' && (
					<BlockEditContextProvider
						value={ { name: 'another-block' } }
					>
						<Edit attributes={ { uniqueId } } />
					</BlockEditContextProvider>
				) }
				{ uniqueId === 'MUTUALLY-RECURSIVE-1' && (
					<Edit attributes={ { uniqueId: 'MUTUALLY-RECURSIVE-2' } } />
				) }
				{ uniqueId === 'MUTUALLY-RECURSIVE-2' && (
					<Edit attributes={ { uniqueId: 'MUTUALLY-RECURSIVE-1' } } />
				) }
			</div>
		</RecursionProvider>
	);
}

describe( 'useHasRecursion/RecursionProvider', () => {
	const context = { name: 'reusable-block' };

	it( 'allows a single block to render', () => {
		render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'SIMPLE' } } />
			</BlockEditContextProvider>
		);
		expect(
			screen.getByTestId( 'wp-block__reusable-block' )
		).toBeVisible();
		expect(
			screen.queryByTestId( 'wp-block__reusable-block--halted' )
		).not.toBeInTheDocument();
	} );

	it( 'allows equal but sibling blocks to render', () => {
		render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'SIMPLE' } } />
				<Edit attributes={ { uniqueId: 'SIMPLE' } } />
			</BlockEditContextProvider>
		);
		expect(
			screen.getAllByTestId( 'wp-block__reusable-block' )
		).toHaveLength( 2 );
		expect(
			screen.queryByTestId( 'wp-block__reusable-block--halted' )
		).not.toBeInTheDocument();
	} );

	it( 'prevents a block from rendering itself', () => {
		render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'SINGLY-RECURSIVE' } } />
			</BlockEditContextProvider>
		);
		expect(
			screen.getByTestId( 'wp-block__reusable-block' )
		).toBeVisible();
		expect(
			screen.getByTestId( 'wp-block__reusable-block--halted' )
		).toBeVisible();
	} );

	it( 'prevents a block from rendering itself only when the same block type', () => {
		render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'ANOTHER-BLOCK-SAME-ID' } } />
			</BlockEditContextProvider>
		);
		expect(
			screen.getByTestId( 'wp-block__reusable-block' )
		).toBeVisible();
		expect( screen.getByTestId( 'wp-block__another-block' ) ).toBeVisible();
		expect(
			screen.getByTestId( 'wp-block__another-block--halted' )
		).toBeVisible();
	} );

	it( 'prevents mutual recursion between two blocks', () => {
		render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'MUTUALLY-RECURSIVE-1' } } />
			</BlockEditContextProvider>
		);
		expect(
			screen.getAllByTestId( 'wp-block__reusable-block' )
		).toHaveLength( 2 );
		expect(
			screen.getByTestId( 'wp-block__reusable-block--halted' )
		).toBeVisible();
	} );
} );
