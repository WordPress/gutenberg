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
import BlockTypesTab from '../block-types-tab';

jest.mock( '../hooks/use-clipboard-block' );
jest.mock( '@wordpress/data/src/components/use-select' );

const selectMock = {
	getCategories: jest.fn().mockReturnValue( [] ),
	getCollections: jest.fn().mockReturnValue( [] ),
	getInserterItems: jest.fn().mockReturnValue( [] ),
	canInsertBlockType: jest.fn(),
	getBlockType: jest.fn(),
	getClipboard: jest.fn(),
	getSettings: jest.fn( () => ( { impressions: {} } ) ),
};

describe( 'BlockTypesTab component', () => {
	beforeEach( () => {
		useSelect.mockImplementation( ( callback ) =>
			callback( () => selectMock )
		);
	} );

	it( 'renders without crashing', () => {
		const component = render(
			<BlockTypesTab
				rootClientId={ 0 }
				onSelect={ jest.fn() }
				listProps={ { contentContainerStyle: {} } }
			/>
		);
		expect( component ).toBeTruthy();
	} );

	it( 'shows block items', () => {
		selectMock.getInserterItems.mockReturnValue( items );

		const blockItems = items.filter(
			( { id, category } ) =>
				category !== 'reusable' && id !== 'core-embed/a-paragraph-embed'
		);
		const component = render(
			<BlockTypesTab
				rootClientId={ 0 }
				onSelect={ jest.fn() }
				listProps={ { contentContainerStyle: {} } }
			/>
		);

		blockItems.forEach( ( item ) => {
			expect( component.getByText( item.title ) ).toBeTruthy();
		} );
	} );
} );
