/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import items from './fixtures';
import ReusableBlocksTab from '../reusable-blocks-tab';
import BlockTypesList from '../../block-types-list';

jest.mock( '../../block-types-list' );
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
		const component = shallow(
			<ReusableBlocksTab
				rootClientId={ 0 }
				onSelect={ jest.fn() }
				listProps={ {} }
			/>
		);
		expect( component ).toBeTruthy();
	} );

	it( 'shows reusable block items', () => {
		selectMock.getInserterItems.mockReturnValue( items );

		const reusableBlockItems = items.filter(
			( { category } ) => category === 'reusable'
		);
		const component = shallow(
			<ReusableBlocksTab
				rootClientId={ 0 }
				onSelect={ jest.fn() }
				listProps={ {} }
			/>
		);
		expect( component.find( BlockTypesList ).prop( 'items' ) ).toEqual(
			reusableBlockItems
		);
	} );
} );
