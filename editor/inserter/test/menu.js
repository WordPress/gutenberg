/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType, getBlockTypes } from 'blocks';

/**
 * Internal dependencies
 */
import { InserterMenu } from '../menu';

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
	name: 'core/youtube-block',
	title: 'Youtube',
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
	} );

	it( 'should show the recent tab by default', () => {
		const wrapper = shallow(
			<InserterMenu
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
			/>
		);

		expect( enzymeToJson( wrapper ) ).toMatchSnapshot();
	} );

	it( 'should show the recently used blocks in the recent tab', () => {
		const wrapper = shallow(
			<InserterMenu
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [ advancedTextBlock ] }
			/>
		);

		expect( enzymeToJson( wrapper ) ).toMatchSnapshot();
	} );

	it( 'should show blocks from the embed category in the embed tab', () => {
		const wrapper = shallow(
			<InserterMenu
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
			/>
		);
		const embedTab = wrapper.find( '.editor-inserter__tab' )
			.filterWhere( ( node ) => node.text() === 'Embeds' );
		embedTab.simulate( 'click' );

		expect( enzymeToJson( wrapper ) ).toMatchSnapshot();
	} );

	it( 'should show all blocks except embeds in the blocks tab', () => {
		const wrapper = shallow(
			<InserterMenu
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
			/>
		);
		const embedTab = wrapper.find( '.editor-inserter__tab' )
			.filterWhere( ( node ) => node.text() === 'Blocks' );
		embedTab.simulate( 'click' );

		expect( enzymeToJson( wrapper ) ).toMatchSnapshot();
	} );

	it( 'should disable already used blocks with `usedOnce`', () => {
		const wrapper = shallow(
			<InserterMenu
				instanceId={ 1 }
				blocks={ [ { name: moreBlock.name } ] }
				recentlyUsedBlocks={ [] }
			/>
		);
		const embedTab = wrapper.find( '.editor-inserter__tab' )
			.filterWhere( ( node ) => node.text() === 'Blocks' );
		embedTab.simulate( 'click' );

		expect( enzymeToJson( wrapper ) ).toMatchSnapshot();
	} );

	it( 'should allow searching for blocks', () => {
		const wrapper = shallow(
			<InserterMenu
				instanceId={ 1 }
				blocks={ [] }
				recentlyUsedBlocks={ [] }
			/>
		);
		wrapper.setState( { filterValue: 'text' } );

		expect( enzymeToJson( wrapper ) ).toMatchSnapshot();
	} );
} );
