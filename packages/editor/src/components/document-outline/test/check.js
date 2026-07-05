/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

/**
 * Internal dependencies
 */
import DocumentOutlineCheck from '../check';
import useHeadingBlockTypes from '../use-heading-block-types';

jest.mock( '../use-heading-block-types' );

function setupMockSelect( headingBlockNames, blocks ) {
	useHeadingBlockTypes.mockReturnValue( headingBlockNames );
	useSelect.mockImplementation( ( mapSelect ) => {
		return mapSelect( () => ( {
			getBlocksByName: ( names ) =>
				blocks
					.filter( ( block ) => names.includes( block.name ) )
					.map( ( block ) => block.clientId ),
		} ) );
	} );
}

describe( 'DocumentOutlineCheck', () => {
	it( 'does not render if there are no headings', () => {
		setupMockSelect( [ 'core/heading' ], [] );
		render( <DocumentOutlineCheck>content</DocumentOutlineCheck> );
		expect( screen.queryByText( 'content' ) ).not.toBeInTheDocument();
	} );

	it( 'renders if there is a block added via the editor.headingBlockTypes filter, even without a core/heading block', () => {
		setupMockSelect(
			[ 'core/heading', 'my-plugin/section-heading' ],
			[ { clientId: '1', name: 'my-plugin/section-heading' } ]
		);
		render( <DocumentOutlineCheck>content</DocumentOutlineCheck> );
		expect( screen.getByText( 'content' ) ).toBeVisible();
	} );
} );
