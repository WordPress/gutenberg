/* eslint-disable gutenberg/use-typescript */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useBlockEditingMode } from '@wordpress/block-editor';
import PostTitleEdit from '../edit';

const mockProviderValues = [];

vi.mock( import( '@wordpress/block-editor' ), () => ( {
	BlockContextProvider: ( { value, children } ) => {
		mockProviderValues.push( value );
		return children;
	},
	BlockControls: () => null,
	InspectorControls: () => null,
	HeadingLevelDropdown: () => null,
	PlainText: ( { value } ) =>
		createElement( 'h2', { 'data-testid': 'editable' }, value ),
	useBlockProps: () => ( {} ),
	useBlockEditingMode: vi.fn( () => 'contentOnly' ),
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( {
	store: 'core',
	useEntityProp: () => [ 'Hello', vi.fn(), { rendered: 'Hello' } ],
} ) );

vi.mock( import( '../../utils/hooks' ), () => ( {
	useToolsPanelDropdownMenuProps: () => ( {} ),
} ) );

function renderTitle( context, canEdit = true ) {
	useSelect.mockReturnValue( canEdit );
	return render(
		createElement( PostTitleEdit, {
			attributes: { level: 2, levelOptions: [ 2 ] },
			setAttributes: vi.fn(),
			context: { postType: 'post', postId: 1, ...context },
		} )
	);
}

describe( 'Post Title edit', () => {
	beforeEach( () => {
		mockProviderValues.length = 0;
		useBlockEditingMode.mockClear();
	} );

	it( 'is editable in a synced pattern when the user can edit the post', () => {
		renderTitle( { 'pattern/overrides': {} } );

		expect( useBlockEditingMode ).toHaveBeenCalledWith( 'contentOnly' );
		expect( screen.getByTestId( 'editable' ) ).toBeInTheDocument();
		expect( mockProviderValues[ 0 ] ).toEqual( {
			'pattern/overrides': undefined,
		} );
	} );

	it( 'stays static in a synced pattern when the user cannot edit the post', () => {
		renderTitle( { 'pattern/overrides': {} }, false );

		expect( useBlockEditingMode ).toHaveBeenCalledWith( undefined );
		expect( screen.queryByTestId( 'editable' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Hello' ) ).toBeInTheDocument();
	} );

	it( 'does not set an editing mode outside synced patterns', () => {
		renderTitle( {} );

		expect( useBlockEditingMode ).toHaveBeenCalledWith( undefined );
		expect( screen.getByTestId( 'editable' ) ).toBeInTheDocument();
	} );
} );

/* eslint-enable gutenberg/use-typescript */
