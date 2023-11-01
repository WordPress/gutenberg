/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import items from './fixtures';
import ReusableBlocksTab from '../reusable-blocks-tab';

jest.mock( '@wordpress/data/src/components/use-select' );

const fetchReusableBlocks = jest.fn();
const selectMock = {
	getInserterItems: jest.fn().mockReturnValue( [] ),
	getSettings: jest.fn().mockReturnValue( {
		__experimentalFetchReusableBlocks: fetchReusableBlocks,
	} ),
};

describe( 'ReusableBlocksTab component', () => {
	beforeEach( () => {
		useSelect.mockImplementation( ( callback ) =>
			callback( () => selectMock )
		);
	} );

	it( 'renders without crashing', () => {
		const component = render(
			<ReusableBlocksTab
				rootClientId={ 0 }
				onSelect={ jest.fn() }
				listProps={ { contentContainerStyle: {} } }
			/>
		);
		expect( component ).toBeTruthy();
	} );

	it( 'shows reusable block items', () => {
		selectMock.getInserterItems.mockReturnValue( items );

		const reusableBlockItems = items.filter(
			( { category } ) => category === 'reusable'
		);
		const component = render(
			<ReusableBlocksTab
				rootClientId={ 0 }
				onSelect={ jest.fn() }
				listProps={ { contentContainerStyle: {} } }
			/>
		);
		reusableBlockItems.forEach( ( { title } ) => {
			expect( component.getByText( title ) ).toBeTruthy();
		} );
	} );
} );
