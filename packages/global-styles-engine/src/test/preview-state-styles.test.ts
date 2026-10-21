import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { getBlockTypes } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { generatePreviewStateStyles } from '../preview-state-styles';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	select: vi.fn(),
} ) );

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	getBlockSupport: vi.fn(),
	getBlockTypes: vi.fn(),
} ) );

const mockedSelect = select as Mock;
const mockedGetBlockTypes = getBlockTypes as Mock;

describe( 'generatePreviewStateStyles', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		mockedSelect.mockReturnValue( {
			getBlockStyles: () => [],
		} );
		mockedGetBlockTypes.mockReturnValue( [
			{
				name: 'core/button',
				selectors: {
					root: '.wp-block-button .wp-block-button__link',
				},
			},
		] );
	} );

	it( 'renders the state styles of a block as its default styles', () => {
		const css = generatePreviewStateStyles(
			{ color: { text: '#dc2626' } },
			'core/button'
		);

		expect( css ).toContain(
			':root :where(.wp-block-button .wp-block-button__link){color: #dc2626;}'
		);
		expect( css ).not.toContain( ':hover' );
	} );

	it( 'renders the state styles of the link element as its default styles', () => {
		const css = generatePreviewStateStyles(
			{ color: { text: '#dc2626' } },
			'link'
		);

		expect( css ).toContain(
			'a:where(:not(.wp-element-button)){color: #dc2626;}'
		);
		expect( css ).not.toContain( ':hover' );
	} );

	it( 'renders the state styles of the button element as its default styles', () => {
		const css = generatePreviewStateStyles(
			{ color: { background: '#dc2626', text: '#ffffff' } },
			'button'
		);

		expect( css ).toContain(
			':root :where(.wp-element-button, .wp-block-button__link){color: #ffffff;background-color: #dc2626;}'
		);
		// The button element must not be mistaken for the Button block.
		expect( css ).not.toContain(
			'.wp-block-button .wp-block-button__link'
		);
	} );

	it( 'returns an empty string without state styles', () => {
		expect( generatePreviewStateStyles( undefined, 'link' ) ).toBe( '' );
	} );
} );
