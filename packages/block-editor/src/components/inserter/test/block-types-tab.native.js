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
import BlockTypesTab from '../block-types-tab';
import BlockTypesList from '../../block-types-list';

jest.mock( '../../block-types-list' );
jest.mock( '../hooks/use-clipboard-block' );
jest.mock( '@wordpress/data/src/components/use-select' );

const selectMock = {
	getInserterItems: jest.fn().mockReturnValue( [] ),
	canInsertBlockType: jest.fn(),
	getBlockType: jest.fn(),
	getClipboard: jest.fn(),
};

describe( 'BlockTypesTab component', () => {
	beforeEach( () => {
		useSelect.mockImplementation( ( callback ) =>
			callback( () => selectMock )
		);
	} );

	it( 'renders without crashing', () => {
		const component = shallow(
			<BlockTypesTab
				rootClientId={ 0 }
				onSelect={ jest.fn() }
				listProps={ {} }
			/>
		);
		expect( component ).toBeTruthy();
	} );

	it( 'shows block items', () => {
		selectMock.getInserterItems.mockReturnValue( items );

		const blockItems = items.filter(
			( { category } ) => category !== 'reusable'
		);
		const component = shallow(
			<BlockTypesTab
				rootClientId={ 0 }
				onSelect={ jest.fn() }
				listProps={ {} }
			/>
		);
		expect( component.find( BlockTypesList ).prop( 'items' ) ).toEqual(
			blockItems
		);
	} );
} );
