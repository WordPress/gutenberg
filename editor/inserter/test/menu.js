/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType, getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { InserterMenu, searchBlocks } from '../menu';

const textBlock = {
	name: 'core/text-block',
	title: 'Text',
	save: noop,
	edit: noop,
	category: 'common',
};

const advancedTextBlock = {
	name: 'core/advanced-text-block',
	title: 'Advanced Text',
	save: noop,
	edit: noop,
	category: 'common',
};

const someOtherBlock = {
	name: 'core/some-other-block',
	title: 'Some Other Block',
	save: noop,
	edit: noop,
	category: 'common',
};

const moreBlock = {
	name: 'core/more-block',
	title: 'More',
	save: noop,
	edit: noop,
	category: 'layout',
	useOnce: 'true',
};

const youtubeBlock = {
	name: 'core-embed/youtube',
	title: 'YouTube',
	save: noop,
	edit: noop,
	category: 'embed',
	keywords: [ 'google' ],
};

const textEmbedBlock = {
	name: 'core-embed/a-text-embed',
	title: 'A Text Embed',
	save: noop,
	edit: noop,
	category: 'embed',
};

describe( 'InserterMenu', () => {
	const unregisterAllBlocks = () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	};

	afterEach( () => {
		unregisterAllBlocks();
	} );

	beforeEach( () => {
		unregisterAllBlocks();
		registerBlockType( textBlock.name, textBlock );
		registerBlockType( advancedTextBlock.name, advancedTextBlock );
		registerBlockType( someOtherBlock.name, someOtherBlock );
		registerBlockType( moreBlock.name, moreBlock );
		registerBlockType( youtubeBlock.name, youtubeBlock );
		registerBlockType( textEmbedBlock.name, textEmbedBlock );
	} );

	it( 'should show the recent tab by default', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
				debouncedSpeak={ noop }
			/>
		);

		const activeCategory = wrapper.find( '.editor-inserter__tab .is-active' );
		expect( activeCategory.text() ).toBe( 'Recent' );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks.length ).toBe( 0 );
	} );

	it( 'should show the recently used blocks in the recent tab', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [ advancedTextBlock ] }
				debouncedSpeak={ noop }
			/>
		);

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks.length ).toBe( 1 );
		expect( visibleBlocks.at( 0 ).childAt( 0 ).name() ).toBe( 'BlockIcon' );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'Advanced Text' );
	} );

	it( 'should show blocks from the embed category in the embed tab', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
				debouncedSpeak={ noop }
			/>
		);
		const embedTab = wrapper.find( '.editor-inserter__tab' )
			.filterWhere( ( node ) => node.text() === 'Embeds' );
		embedTab.simulate( 'click' );

		const activeCategory = wrapper.find( '.editor-inserter__tab .is-active' );
		expect( activeCategory.text() ).toBe( 'Embeds' );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks.length ).toBe( 2 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'YouTube' );
		expect( visibleBlocks.at( 1 ).text() ).toBe( 'A Text Embed' );
	} );

	it( 'should show all blocks except embeds in the blocks tab', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
				debouncedSpeak={ noop }
			/>
		);
		const blocksTab = wrapper.find( '.editor-inserter__tab' )
			.filterWhere( ( node ) => node.text() === 'Blocks' );
		blocksTab.simulate( 'click' );

		const activeCategory = wrapper.find( '.editor-inserter__tab .is-active' );
		expect( activeCategory.text() ).toBe( 'Blocks' );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks.length ).toBe( 4 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'Text' );
		expect( visibleBlocks.at( 1 ).text() ).toBe( 'Advanced Text' );
		expect( visibleBlocks.at( 2 ).text() ).toBe( 'Some Other Block' );
		expect( visibleBlocks.at( 3 ).text() ).toBe( 'More' );
	} );

	it( 'should disable already used blocks with `usedOnce`', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				blocks={ [ { name: moreBlock.name } ] }
				recentlyUsedBlocks={ [] }
				debouncedSpeak={ noop }
			/>
		);
		const blocksTab = wrapper.find( '.editor-inserter__tab' )
			.filterWhere( ( node ) => node.text() === 'Blocks' );
		blocksTab.simulate( 'click' );

		const disabledBlocks = wrapper.find( '.editor-inserter__block[disabled]' );
		expect( disabledBlocks.length ).toBe( 1 );
		expect( disabledBlocks.at( 0 ).text() ).toBe( 'More' );
	} );

	it( 'should allow searching for blocks', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
				debouncedSpeak={ noop }
			/>
		);
		wrapper.setState( { filterValue: 'text' } );

		const tabs = wrapper.find( '.editor-inserter__tab' );
		expect( tabs.length ).toBe( 0 );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks.length ).toBe( 3 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'Text' );
		expect( visibleBlocks.at( 1 ).text() ).toBe( 'Advanced Text' );
		expect( visibleBlocks.at( 2 ).text() ).toBe( 'A Text Embed' );
	} );

	it( 'should trim whitespace of search terms', () => {
		const wrapper = mount(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
				debouncedSpeak={ noop }
			/>
		);
		wrapper.setState( { filterValue: ' text' } );

		const tabs = wrapper.find( '.editor-inserter__tab' );
		expect( tabs.length ).toBe( 0 );

		const visibleBlocks = wrapper.find( '.editor-inserter__block' );
		expect( visibleBlocks.length ).toBe( 3 );
		expect( visibleBlocks.at( 0 ).text() ).toBe( 'Text' );
		expect( visibleBlocks.at( 1 ).text() ).toBe( 'Advanced Text' );
		expect( visibleBlocks.at( 2 ).text() ).toBe( 'A Text Embed' );
	} );
} );

describe( 'searchBlocks', () => {
	it( 'should search blocks using the title ignoring case', () => {
		const blocks = [ textBlock, advancedTextBlock, moreBlock, youtubeBlock, textEmbedBlock ];
		expect( searchBlocks( blocks, 'TEXT' ) ).toEqual(
			[ textBlock, advancedTextBlock, textEmbedBlock ]
		);
	} );

	it( 'should search blocks using the keywords', () => {
		const blocks = [ textBlock, advancedTextBlock, moreBlock, youtubeBlock, textEmbedBlock ];
		expect( searchBlocks( blocks, 'GOOGL' ) ).toEqual(
			[ youtubeBlock ]
		);
	} );
} );
