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
		// `wp_kses` encodes ampersands in block attribute JSON for users
		// without `unfiltered_html`, so the saved block delimiter for
		// `\begin{pmatrix} a & b \\ c & d \end{pmatrix}` arrives at the
		// editor with `&amp;` in place of every `&`. The block must
		// decode those before handing the source to the LaTeX renderer.
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
			expect( setAttributes ).toHaveBeenCalled();
		} );
		expect( setAttributes ).toHaveBeenLastCalledWith( {
			latex: 'a & b',
			mathML: '<mi>mock-a & b</mi>',
		} );
		expect( mockMarkNotPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'recomputes mathML when entities are present, replacing the stored value', async () => {
		// If a prior save persisted a corrupted mathML alongside the
		// entity-encoded latex, the mount-time effect must overwrite it
		// with a freshly rendered value derived from the decoded latex.
		// Otherwise the next save would re-persist the broken markup.
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
		expect( setAttributes ).toHaveBeenLastCalledWith(
			expect.objectContaining( { mathML: '<mi>mock-a & b</mi>' } )
		);
	} );

	test( 'does not clobber a user edit made before the renderer loads', async () => {
		// The LaTeX renderer is loaded via a dynamic `import()`, so there
		// is a window between mount and resolution during which the user
		// can edit the textarea. The mount-time effect must operate on
		// the current value at resolution time, not on the mount value.
		const setAttributes = vi.fn();
		const { rerender } = render(
			<MathEdit
				attributes={ {
					latex: 'a &amp; b',
					mathML: '',
				} }
				setAttributes={ setAttributes }
				isSelected={ false }
			/>
		);
		// Simulate the user typing before the dynamic import resolves.
		rerender(
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
		// The current value has no entities, so the effect must only
		// write `mathML` — writing `latex` would clobber the user edit.
		expect( setAttributes ).toHaveBeenLastCalledWith( {
			mathML: '<mi>mock-x = y</mi>',
		} );
	} );
} );
