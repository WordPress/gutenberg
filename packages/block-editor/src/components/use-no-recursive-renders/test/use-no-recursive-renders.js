/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useNoRecursiveRenders from '../';
import {
	BlockEditContextProvider,
	useBlockEditContext,
} from '../../block-edit/context';

// Mimics a block's Edit component, such as ReusableBlockEdit, which is capable
// of calling itself depending on its `uniqueId` attribute.
function Edit( { attributes: { uniqueId } } ) {
	const { name } = useBlockEditContext();
	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		uniqueId
	);

	if ( hasAlreadyRendered ) {
		return <div className={ `wp-block__${ name }--halted` }>Halt</div>;
	}

	return (
		<RecursionProvider>
			<div className={ `wp-block__${ name }` }>
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

describe( 'useNoRecursiveRenders', () => {
	const context = { name: 'reusable-block' };

	it( 'allows a single block to render', () => {
		const { container } = render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'SIMPLE' } } />
			</BlockEditContextProvider>
		);
		expect(
			container.querySelectorAll( '.wp-block__reusable-block' )
		).toHaveLength( 1 );
		expect(
			container.querySelectorAll( '.wp-block__reusable-block--halted' )
		).toHaveLength( 0 );
	} );

	it( 'allows equal but sibling blocks to render', () => {
		const { container } = render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'SIMPLE' } } />
				<Edit attributes={ { uniqueId: 'SIMPLE' } } />
			</BlockEditContextProvider>
		);
		expect(
			container.querySelectorAll( '.wp-block__reusable-block' )
		).toHaveLength( 2 );
		expect(
			container.querySelectorAll( '.wp-block__reusable-block--halted' )
		).toHaveLength( 0 );
	} );

	it( 'prevents a block from rendering itself', () => {
		const { container } = render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'SINGLY-RECURSIVE' } } />
			</BlockEditContextProvider>
		);
		expect(
			container.querySelectorAll( '.wp-block__reusable-block' )
		).toHaveLength( 1 );
		expect(
			container.querySelectorAll( '.wp-block__reusable-block--halted' )
		).toHaveLength( 1 );
	} );

	it( 'prevents a block from rendering itself only when the same block type', () => {
		const { container } = render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'ANOTHER-BLOCK-SAME-ID' } } />
			</BlockEditContextProvider>
		);
		expect(
			container.querySelectorAll( '.wp-block__reusable-block' )
		).toHaveLength( 1 );
		expect(
			container.querySelectorAll( '.wp-block__another-block' )
		).toHaveLength( 1 );
		expect(
			container.querySelectorAll( '.wp-block__another-block--halted' )
		).toHaveLength( 1 );
	} );

	it( 'prevents mutual recursion between two blocks', () => {
		const { container } = render(
			<BlockEditContextProvider value={ context }>
				<Edit attributes={ { uniqueId: 'MUTUALLY-RECURSIVE-1' } } />
			</BlockEditContextProvider>
		);
		expect(
			container.querySelectorAll( '.wp-block__reusable-block' )
		).toHaveLength( 2 );
		expect(
			container.querySelectorAll( '.wp-block__reusable-block--halted' )
		).toHaveLength( 1 );
	} );
} );
