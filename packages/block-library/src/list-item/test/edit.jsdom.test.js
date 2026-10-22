import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import ListItemEdit from '../edit';

let mockIsOrdered;

vi.mock( import( '@wordpress/block-editor' ), async () => {
	const { createElement: h } = await import( '@wordpress/element' );
	const passthrough = ( { children } ) => h( 'div', null, children );

	return {
		BlockControls: passthrough,
		InspectorControls: passthrough,
		RichText: () => h( 'div' ),
		useBlockProps: ( props ) => ( { ...props } ),
		useInnerBlocksProps: ( props ) => ( { ...props, children: null } ),
		store: 'core/block-editor',
	};
} );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const data = await importOriginal();

	return new Proxy( data, {
		get( target, property ) {
			if ( property === 'useSelect' ) {
				return ( callback ) =>
					callback( () => ( {
						getBlockRootClientId: () => 'list',
						getBlockAttributes: () => ( {
							ordered: mockIsOrdered,
						} ),
					} ) );
			}
			if ( property === 'useRegistry' ) {
				return () => ( {} );
			}
			return target[ property ];
		},
	} );
} );

vi.mock( import( '../hooks' ), () => ( {
	useEnter: () => null,
	useTab: () => null,
	useMultiSelectTab: () => null,
	useMerge: () => vi.fn(),
} ) );

vi.mock( import( '../utils' ), () => ( {
	indentListItems: vi.fn(),
	outdentListItems: vi.fn(),
	getIndentTarget: () => null,
	getOutdentTarget: () => null,
} ) );

vi.mock( import( '../../utils/hooks' ), () => ( {
	useToolsPanelDropdownMenuProps: () => ( {} ),
} ) );

function renderEdit( attributes = {} ) {
	const setAttributes = vi.fn();

	render(
		createElement( ListItemEdit, {
			attributes: { content: 'Item', ...attributes },
			setAttributes,
			clientId: 'item',
			mergeBlocks: vi.fn(),
		} )
	);

	return { setAttributes };
}

describe( 'ListItemEdit item value', () => {
	beforeEach( () => {
		mockIsOrdered = true;
	} );

	it( 'shows the Custom number field in an ordered list', () => {
		renderEdit();

		expect(
			screen.getByRole( 'spinbutton', { name: 'Custom number' } )
		).toBeVisible();
	} );

	it( 'hides the Custom number field in an unordered list', () => {
		mockIsOrdered = false;
		renderEdit();

		expect(
			screen.queryByRole( 'spinbutton', { name: 'Custom number' } )
		).not.toBeInTheDocument();
	} );

	it( 'stores the value as a string', () => {
		const { setAttributes } = renderEdit();

		fireEvent.change(
			screen.getByRole( 'spinbutton', { name: 'Custom number' } ),
			{ target: { value: '7' } }
		);

		expect( setAttributes ).toHaveBeenCalledWith( { value: '7' } );
	} );

	it( 'unsets the value when the field is cleared', () => {
		const { setAttributes } = renderEdit( { value: '7' } );

		fireEvent.change(
			screen.getByRole( 'spinbutton', { name: 'Custom number' } ),
			{ target: { value: '' } }
		);

		expect( setAttributes ).toHaveBeenCalledWith( { value: undefined } );
	} );

	it( 'ignores values that are not positive whole numbers', () => {
		const { setAttributes } = renderEdit();
		const input = screen.getByRole( 'spinbutton', {
			name: 'Custom number',
		} );

		[ '2.5', '-3', '1e3', '0', '05' ].forEach( ( value ) => {
			fireEvent.change( input, { target: { value } } );
		} );

		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'blocks the characters that are not part of a whole number', () => {
		renderEdit();
		const input = screen.getByRole( 'spinbutton', {
			name: 'Custom number',
		} );

		// `fireEvent` returns false when the default action was prevented.
		[ 'e', 'E', '+', '-', '.', ',' ].forEach( ( key ) => {
			expect( fireEvent.keyDown( input, { key } ) ).toBe( false );
		} );
		expect( fireEvent.keyDown( input, { key: '5' } ) ).toBe( true );
	} );

	it( 'puts the value on the list item in the editor', () => {
		renderEdit( { value: '5' } );

		expect( screen.getByRole( 'listitem' ).value ).toBe( 5 );
	} );

	it( 'adds no value to the list item when there is none', () => {
		renderEdit();

		// An `li` without a `value` attribute reports 0.
		expect( screen.getByRole( 'listitem' ).value ).toBe( 0 );
	} );
} );
