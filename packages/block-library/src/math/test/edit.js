/**
 * External dependencies
 */
import { render, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MathEdit from '../edit';

const mockLatexToMathML = jest.fn( ( latex ) => `<mi>mock-${ latex }</mi>` );

jest.mock( '@wordpress/latex-to-mathml', () => ( {
	__esModule: true,
	default: ( latex, options ) => mockLatexToMathML( latex, options ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: jest.fn( () => ( {} ) ),
	store: { name: 'core/block-editor' },
} ) );

jest.mock( '@wordpress/data', () => {
	const identity = ( fn ) => fn;
	return {
		useDispatch: () => ( {
			__unstableMarkNextChangeAsNotPersistent: jest.fn(),
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
	} );

	test( 'decodes HTML entities in latex before generating MathML', async () => {
		// WordPress kses encodes ampersands in block attribute JSON for users
		// without `unfiltered_html`, e.g. saving `a & b` produces `a &amp; b`
		// in the block delimiter on reload. The block must decode that before
		// passing it to the LaTeX renderer.
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

		const latestCallArgs =
			setAttributes.mock.calls[
				setAttributes.mock.calls.length - 1
			][ 0 ];
		expect( latestCallArgs.mathML ).toBe( '<mi>mock-a & b</mi>' );
		expect( latestCallArgs.mathML ).not.toBe( corruptedMathML );
	} );

	test( 'does not modify latex when no entities are present', async () => {
		const setAttributes = jest.fn();
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
