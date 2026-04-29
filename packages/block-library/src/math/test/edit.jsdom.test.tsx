import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type latexToMathML from '@wordpress/latex-to-mathml';
import MathEdit from '../edit';

const { mockLatexToMathML, mockMarkNotPersistent } = vi.hoisted( () => ( {
	mockLatexToMathML: vi.fn< typeof latexToMathML >(),
	mockMarkNotPersistent: vi.fn(),
} ) );

vi.mock( import( '@wordpress/latex-to-mathml' ), () => ( {
	default: mockLatexToMathML,
} ) );

// @ts-expect-error `@wordpress/block-editor` does not publish TypeScript declarations.
vi.mock( import( '@wordpress/block-editor' ), () => ( {
	useBlockProps: () => ( {} ),
	store: { name: 'core/block-editor' },
} ) );

vi.mock(
	import( '@wordpress/data' ),
	async ( importOriginal ) =>
		( {
			...( await importOriginal() ),
			useDispatch: () => ( {
				__unstableMarkNextChangeAsNotPersistent: mockMarkNotPersistent,
			} ),
		} ) as unknown as typeof import('@wordpress/data')
);

describe( 'Math block edit', () => {
	beforeEach( () => {
		mockLatexToMathML.mockImplementation(
			( latex ) => `<mi>mock-${ latex }</mi>`
		);
	} );

	test( 'decodes HTML entities in latex before generating MathML', async () => {
		// WordPress kses encodes ampersands in block attribute JSON for users
		// without `unfiltered_html`, e.g. saving `a & b` produces `a &amp; b`
		// in the block delimiter on reload. The block must decode that before
		// passing it to the LaTeX renderer.
		const setAttributes = vi.fn();
		render(
			<MathEdit
				attributes={ {
					latex: '\\begin{pmatrix} a &amp; b \\\\ c &amp; d \\end{pmatrix}',
					mathML: '',
				} }
				setAttributes={ setAttributes }
				isSelected={ false }
			/>
		);

		await waitFor( () => {
			expect( mockLatexToMathML ).toHaveBeenCalledWith(
				'\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
				{ displayMode: true }
			);
		} );
	} );

	test( 'normalizes the latex attribute when entities are present', async () => {
		const setAttributes = vi.fn();
		render(
			<MathEdit
				attributes={ {
					latex: 'a &amp; b',
					mathML: '',
				} }
				setAttributes={ setAttributes }
				isSelected={ false }
			/>
		);

		await waitFor( () => {
			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( { latex: 'a & b' } )
			);
		} );
	} );

	test( 'recomputes mathML when entities are present, replacing the stored value', async () => {
		// If a prior save persisted a corrupted mathML alongside the
		// entity-encoded latex, the mount-time effect must overwrite it with
		// a freshly rendered value derived from the decoded latex. Otherwise
		// the next save would re-persist the broken markup.
		const setAttributes = vi.fn();
		const corruptedMathML = '<mi>old-corrupted</mi>';
		render(
			<MathEdit
				attributes={ {
					latex: 'a &amp; b',
					mathML: corruptedMathML,
				} }
				setAttributes={ setAttributes }
				isSelected={ false }
			/>
		);

		await waitFor( () => {
			expect( setAttributes ).toHaveBeenCalled();
		} );

		const latestCallArgs =
			setAttributes.mock.calls[
				setAttributes.mock.calls.length - 1
			][ 0 ];
		expect( latestCallArgs.mathML ).toBe( '<mi>mock-a & b</mi>' );
		expect( latestCallArgs.mathML ).not.toBe( corruptedMathML );
	} );

	test( 'does not modify latex when no entities are present', async () => {
		const setAttributes = vi.fn();
		render(
			<MathEdit
				attributes={ {
					latex: 'x = y',
					mathML: '',
				} }
				setAttributes={ setAttributes }
				isSelected={ false }
			/>
		);

		await waitFor( () => {
			expect( setAttributes ).toHaveBeenCalled();
		} );

		const latestCallArgs =
			setAttributes.mock.calls[
				setAttributes.mock.calls.length - 1
			][ 0 ];
		expect( latestCallArgs ).not.toHaveProperty( 'latex' );
		expect( latestCallArgs ).toHaveProperty( 'mathML' );
	} );
} );
