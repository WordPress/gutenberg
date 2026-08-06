/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SidebarIdentity from '..';

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { children } ) => children,
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: { name: 'core' },
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: () => ( { editEntityRecord: jest.fn() } ),
} ) );

jest.mock( '@wordpress/dataviews', () => ( {
	DataForm: ( { data, fields } ) => (
		<>
			{ fields
				.filter( ( field ) =>
					[ 'title', 'description' ].includes( field.id )
				)
				.map( ( field ) => (
					<span key={ field.id }>
						{ field.getValue( { item: data } ) }
					</span>
				) ) }
		</>
	),
} ) );

jest.mock( '@wordpress/fields', () => ( {
	MediaEdit: () => null,
} ) );

describe( 'SidebarIdentity', () => {
	beforeEach( () => {
		useSelect.mockReturnValue( {
			title: 'Jordan&#039;s Test &lt;Preview&gt;',
			description: 'Ideas &amp; updates',
		} );
	} );

	it( 'displays decoded text fields', () => {
		render( <SidebarIdentity /> );

		expect( screen.getByText( "Jordan's Test <Preview>" ) ).toBeVisible();
		expect( screen.getByText( 'Ideas & updates' ) ).toBeVisible();
	} );
} );
