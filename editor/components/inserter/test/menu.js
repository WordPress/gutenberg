/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { InserterMenu, searchItems } from '../menu';

const textItem = {
	id: 'core/text-block',
	name: 'core/text-block',
	initialAttributes: {},
	title: 'Text',
	category: 'common',
	isDisabled: false,
};

const advancedTextItem = {
	id: 'core/advanced-text-block',
	name: 'core/advanced-text-block',
	initialAttributes: {},
	title: 'Advanced Text',
	category: 'common',
	isDisabled: false,
};

const someOtherItem = {
	id: 'core/some-other-block',
	name: 'core/some-other-block',
	initialAttributes: {},
	title: 'Some Other Block',
	category: 'common',
	isDisabled: false,
};

const moreItem = {
	id: 'core/more-block',
	name: 'core/more-block',
	initialAttributes: {},
	title: 'More',
	category: 'layout',
	isDisabled: true,
};

const youtubeItem = {
	id: 'core-embed/youtube',
	name: 'core-embed/youtube',
	initialAttributes: {},
	title: 'YouTube',
	category: 'embed',
	keywords: [ 'google' ],
	isDisabled: false,
};

const textEmbedItem = {
	id: 'core-embed/a-text-embed',
	name: 'core-embed/a-text-embed',
	initialAttributes: {},
	title: 'A Text Embed',
	category: 'embed',
	isDisabled: false,
};

const sharedItem = {
	id: 'core/block/123',
	name: 'core/block',
	initialAttributes: { ref: 123 },
	title: 'My shared block',
	category: 'shared',
	isDisabled: false,
};

const items = [
	textItem,
	advancedTextItem,
	someOtherItem,
	moreItem,
	youtubeItem,
	textEmbedItem,
	sharedItem,
];

describe( 'InserterMenu', () => {
	// NOTE: Due to https://github.com/airbnb/enzyme/issues/1174, some of the selectors passed through to
	// wrapper.find have had to be strengthened (and the filterWhere strengthened also), otherwise two
	// results would be returned even though only one was in the DOM.

	it( 'should show the suggested tab by default', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ [] }
				frecentItems={ [] }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
				blockTypes
			/>
		);

		const activeCategory = wrapper.find( '.editor-inserter__tab button.is-active' );
		expect( activeCategory.text() ).toBe( 'Suggested' );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks ).toHaveLength( 0 );
	} );

	it( 'should show nothing if there are no items', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ [] }
				frecentItems={ [] }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
			/>
		);

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks ).toHaveLength( 0 );
	} );

	it( 'should show frecently used items in the suggested tab', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				frecentItems={ [ advancedTextItem, textItem, someOtherItem ] }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
			/>
		);

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'Advanced Text' );
		expect( visibleBlocks.at( 1 ).text() ).toBe( 'Text' );
		expect( visibleBlocks.at( 2 ).text() ).toBe( 'Some Other Block' );
	} );

	it( 'should show items from the embed category in the embed tab', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				frecentItems={ [] }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
			/>
		);
		const embedTab = wrapper.find( '.editor-inserter__tab' )
			.filterWhere( ( node ) => node.text() === 'Embeds' && node.name() === 'button' );
		embedTab.simulate( 'click' );

		const activeCategory = wrapper.find( '.editor-inserter__tab button.is-active' );
		expect( activeCategory.text() ).toBe( 'Embeds' );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks ).toHaveLength( 2 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'YouTube' );
		expect( visibleBlocks.at( 1 ).text() ).toBe( 'A Text Embed' );
	} );

	it( 'should show shared items in the shared tab', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				frecentItems={ [] }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
			/>
		);
		const embedTab = wrapper.find( '.editor-inserter__tab' )
			.filterWhere( ( node ) => node.text() === 'Shared' && node.name() === 'button' );
		embedTab.simulate( 'click' );

		const activeCategory = wrapper.find( '.editor-inserter__tab button.is-active' );
		expect( activeCategory.text() ).toBe( 'Shared' );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks ).toHaveLength( 1 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'My shared block' );
	} );

	it( 'should show all items except embeds and shared blocks in the blocks tab', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				frecentItems={ [] }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
			/>
		);
		const blocksTab = wrapper.find( '.editor-inserter__tab' )
			.filterWhere( ( node ) => node.text() === 'Blocks' && node.name() === 'button' );
		blocksTab.simulate( 'click' );

		const activeCategory = wrapper.find( '.editor-inserter__tab button.is-active' );
		expect( activeCategory.text() ).toBe( 'Blocks' );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks ).toHaveLength( 4 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'Text' );
		expect( visibleBlocks.at( 1 ).text() ).toBe( 'Advanced Text' );
		expect( visibleBlocks.at( 2 ).text() ).toBe( 'Some Other Block' );
		expect( visibleBlocks.at( 3 ).text() ).toBe( 'More' );
	} );

	it( 'should disable items with `isDisabled`', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				frecentItems={ items }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
			/>
		);

		const disabledBlocks = wrapper.find( '.editor-inserter__block[disabled=true]' );
		expect( disabledBlocks ).toHaveLength( 1 );
		expect( disabledBlocks.at( 0 ).text() ).toBe( 'More' );
	} );

	it( 'should allow searching for items', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				frecentItems={ [] }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
			/>
		);
		wrapper.setState( { filterValue: 'text' } );

		const tabs = wrapper.find( '.editor-inserter__tab' );
		expect( tabs ).toHaveLength( 0 );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'Text' );
		expect( visibleBlocks.at( 1 ).text() ).toBe( 'Advanced Text' );
		expect( visibleBlocks.at( 2 ).text() ).toBe( 'A Text Embed' );
	} );

	it( 'should trim whitespace of search terms', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				frecentItems={ [] }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
			/>
		);
		wrapper.setState( { filterValue: ' text' } );

		const tabs = wrapper.find( '.editor-inserter__tab' );
		expect( tabs ).toHaveLength( 0 );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'Text' );
		expect( visibleBlocks.at( 1 ).text() ).toBe( 'Advanced Text' );
		expect( visibleBlocks.at( 2 ).text() ).toBe( 'A Text Embed' );
	} );
} );

describe( 'searchItems', () => {
	it( 'should search items using the title ignoring case', () => {
		expect( searchItems( items, 'TEXT' ) ).toEqual(
			[ textItem, advancedTextItem, textEmbedItem ]
		);
	} );

	it( 'should search items using the keywords', () => {
		expect( searchItems( items, 'GOOGL' ) ).toEqual(
			[ youtubeItem ]
		);
	} );
} );
