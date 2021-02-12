/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __experimentalUseNoRecursiveRenders as useNoRecursiveRenders } from '@wordpress/block-editor';

// Mimics a block's Edit component, such as ReusableBlockEdit, which is capable
// of calling itself depending on its `ref` attribute.
function Edit( { attributes: { ref } } ) {
	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		ref
	);

	if ( hasAlreadyRendered ) {
		return <div className="wp-block__reusable-block--halted">Halt</div>;
	}

	return (
		<RecursionProvider>
			<div className="wp-block__reusable-block">
				{ ref === 'SIMPLE' && <p>Done</p> }
				{ ref === 'SINGLY-RECURSIVE' && (
					<Edit attributes={ { ref } } />
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
	it( 'allows a single block to render', () => {
		const { container } = render(
			<Edit attributes={ { ref: 'SIMPLE' } } />
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
			<Fragment>
				<Edit attributes={ { ref: 'SIMPLE' } } />
				<Edit attributes={ { ref: 'SIMPLE' } } />
			</Fragment>
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
			<Fragment>
				<Edit attributes={ { ref: 'SINGLY-RECURSIVE' } } />
			</Fragment>
		);
		expect(
			container.querySelectorAll( '.wp-block__reusable-block' )
		).toHaveLength( 1 );
		expect(
			container.querySelectorAll( '.wp-block__reusable-block--halted' )
		).toHaveLength( 1 );
	} );

	it( 'prevents mutual recursion between two blocks', () => {
		const { container } = render(
			<Fragment>
				<Edit attributes={ { ref: 'MUTUALLY-RECURSIVE-1' } } />
			</Fragment>
		);
		expect(
			container.querySelectorAll( '.wp-block__reusable-block' )
		).toHaveLength( 2 );
		expect(
			container.querySelectorAll( '.wp-block__reusable-block--halted' )
		).toHaveLength( 1 );
	} );
} );
