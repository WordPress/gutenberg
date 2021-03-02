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
// of calling itself depending on its `ref` attribute.
function Edit( { attributes: { ref } } ) {
	const { name } = useBlockEditContext();
	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		ref
	);

	if ( hasAlreadyRendered ) {
		return <div className={ `wp-block__${ name }--halted` }>Halt</div>;
	}

	return (
		<RecursionProvider>
			<div className={ `wp-block__${ name }` }>
				{ ref === 'SIMPLE' && <p>Done</p> }
				{ ref === 'SINGLY-RECURSIVE' && (
					<Edit attributes={ { ref } } />
				) }
				{ ref === 'ANOTHER-BLOCK-SAME-REF' && (
					<BlockEditContextProvider
						value={ { name: 'another-block' } }
					>
						<Edit attributes={ { ref } } />
					</BlockEditContextProvider>
				) }
				{ ref === 'MUTUALLY-RECURSIVE-1' && (
					<Edit attributes={ { ref: 'MUTUALLY-RECURSIVE-2' } } />
				) }
				{ ref === 'MUTUALLY-RECURSIVE-2' && (
					<Edit attributes={ { ref: 'MUTUALLY-RECURSIVE-1' } } />
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
				<Edit attributes={ { ref: 'SIMPLE' } } />
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
				<Edit attributes={ { ref: 'SIMPLE' } } />
				<Edit attributes={ { ref: 'SIMPLE' } } />
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
				<Edit attributes={ { ref: 'SINGLY-RECURSIVE' } } />
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
				<Edit attributes={ { ref: 'ANOTHER-BLOCK-SAME-REF' } } />
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
				<Edit attributes={ { ref: 'MUTUALLY-RECURSIVE-1' } } />
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
