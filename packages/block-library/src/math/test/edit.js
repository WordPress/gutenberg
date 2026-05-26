/**
 * External dependencies
 */
import { render, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MathEdit from '../edit';

const mockLatexToMathML = jest.fn( ( latex ) => `<mi>mock-${ latex }</mi>` );
const mockMarkNotPersistent = jest.fn();

jest.mock( '@wordpress/latex-to-mathml', () => ( {
	__esModule: true,
	default: mockLatexToMathML,
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: jest.fn( () => ( {} ) ),
	store: { name: 'core/block-editor' },
} ) );

// `@wordpress/components` transitively imports `@wordpress/rich-text` and
// other consumers of `@wordpress/data` at module-load time, so we have
// to stub more of the surface than the math block itself uses.
jest.mock( '@wordpress/data', () => {
	const identity = ( fn ) => fn;
	return {
		useDispatch: () => ( {
			__unstableMarkNextChangeAsNotPersistent: mockMarkNotPersistent,
		} ),
		useSelect: () => ( {} ),
		useRegistry: () => ( {} ),
		createRegistrySelector: identity,
		createRegistryControl: identity,
		createSelector: identity,
		createReduxStore: () => ( {} ),
		register: jest.fn(),
		combineReducers: ( reducers ) => reducers,
		dispatch: () => ( {} ),
		select: () => ( {} ),
		subscribe: jest.fn(),
		controls: {},
		plugins: {},
		AsyncModeProvider: ( { children } ) => children,
		RegistryProvider: ( { children } ) => children,
	};
} );

jest.mock( '@wordpress/a11y', () => ( {
	speak: jest.fn(),
} ) );

jest.mock( '../../lock-unlock', () => ( {
	unlock: () => ( { Badge: ( { children } ) => children } ),
} ) );

describe( 'Math block edit', () => {
	beforeEach( () => {
		mockLatexToMathML.mockClear();
		mockMarkNotPersistent.mockClear();
	} );

	test( 'decodes HTML entities in latex before generating MathML', async () => {
		// `wp_kses` encodes ampersands in block attribute JSON for users
		// without `unfiltered_html`, so the saved block delimiter for
		// `\begin{pmatrix} a & b \\ c & d \end{pmatrix}` arrives at the
		// editor with `&amp;` in place of every `&`. The block must
		// decode those before handing the source to the LaTeX renderer.
		const setAttributes = jest.fn();
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
		const setAttributes = jest.fn();
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
		const setAttributes = jest.fn();
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
		const setAttributes = jest.fn();
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
