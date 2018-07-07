/**
 * External dependencies
 */
import { noop } from 'lodash';
import renderer from 'react-test-renderer';

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
	utility: 1,
};

const advancedTextItem = {
	id: 'core/advanced-text-block',
	name: 'core/advanced-text-block',
	initialAttributes: {},
	title: 'Advanced Text',
	category: 'common',
	isDisabled: false,
	utility: 1,
};

const someOtherItem = {
	id: 'core/some-other-block',
	name: 'core/some-other-block',
	initialAttributes: {},
	title: 'Some Other Block',
	category: 'common',
	isDisabled: false,
	utility: 1,
};

const moreItem = {
	id: 'core/more-block',
	name: 'core/more-block',
	initialAttributes: {},
	title: 'More',
	category: 'layout',
	isDisabled: true,
	utility: 0,
};

const youtubeItem = {
	id: 'core-embed/youtube',
	name: 'core-embed/youtube',
	initialAttributes: {},
	title: 'YouTube',
	category: 'embed',
	keywords: [ 'google' ],
	isDisabled: false,
	utility: 0,
};

const textEmbedItem = {
	id: 'core-embed/a-text-embed',
	name: 'core-embed/a-text-embed',
	initialAttributes: {},
	title: 'A Text Embed',
	category: 'embed',
	isDisabled: false,
	utility: 0,
};

const sharedItem = {
	id: 'core/block/123',
	name: 'core/block',
	initialAttributes: { ref: 123 },
	title: 'My shared block',
	category: 'shared',
	isDisabled: false,
	utility: 0,
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

const mockEvent = {
	preventDefault: () => true,
	change: ( value ) => {
		return { target: { value } };
	},
};

const initializeMenuStateAndReturnWrapper = () => {
	const wrapper = renderer.create(
		<InserterMenu
			position={ 'top center' }
			instanceId={ 1 }
			items={ items }
			debouncedSpeak={ noop }
			fetchSharedBlocks={ noop }
			setTimeout={ noop }
		/>
	);
	const activeTabs = wrapper.root.findAll( ( node ) => {
		return node.props.className &&
			node.props.className === 'components-panel__body is-opened';
	} );
	activeTabs.forEach( ( tab ) => {
		const toggleButton = tab.find( ( node ) => {
			return node.type === 'button' &&
				node.props.className.includes( 'components-button' );
		} );
		toggleButton.props.onClick( mockEvent );
	} );
	return wrapper;
};

describe( 'InserterMenu', () => {
	// NOTE: Due to https://github.com/airbnb/enzyme/issues/1174, some of the selectors passed through to
	// wrapper.find have had to be strengthened (and the filterWhere strengthened also), otherwise two
	// results would be returned even though only one was in the DOM.

	it( 'should show the suggested tab by default', () => {
		const wrapper = renderer.create(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
				setTimeout={ noop }
			/>
		);

		const activeCategory = wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className.includes( 'components-panel__body is-opened' );
		} ).find( ( node ) => {
			return node.props.className &&
				node.props.className.includes( 'components-panel__body-title' );
		} ).find( ( node ) => {
			return node.type === 'button';
		} );

		expect( activeCategory.props.children.includes( 'Most Used' ) ).toBe( true );
	} );

	it( 'should show nothing if there are no items', () => {
		const wrapper = renderer.create(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ [] }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
				setTimeout={ noop }
			/>
		);

		const visibleBlocks = () => wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className.includes( 'editor-block-types-list__item' );
		} );
		// find will throw an error if it can't find the item.
		expect( visibleBlocks ).toThrow();

		const noResultsMessage = wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className.includes( 'editor-inserter__no-results' );
		} );
		expect( noResultsMessage.children ).toHaveLength( 1 );
		expect( noResultsMessage.children[ 0 ] ).toEqual( 'No blocks found.' );
	} );

	it( 'should show only high utility items in the suggested tab', () => {
		const wrapper = renderer.create(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
				setTimeout={ noop }
			/>
		);

		const visibleBlocks = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-block-types-list__item-title';
		} );
		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks[ 0 ].children[ 0 ] ).toEqual( 'Text' );
		expect( visibleBlocks[ 1 ].children[ 0 ] ).toEqual( 'Advanced Text' );
		expect( visibleBlocks[ 2 ].children[ 0 ] ).toEqual( 'Some Other Block' );
	} );

	it( 'should limit the number of items shown in the suggested tab', () => {
		const wrapper = renderer.create(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
				maxSuggestedItems={ 2 }
				setTimeout={ noop }
			/>
		);

		const visibleBlocks = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className.includes( 'editor-block-types-list__list-item' );
		} );
		expect( visibleBlocks ).toHaveLength( 2 );
	} );

	it( 'should show items from the embed category in the embed tab', () => {
		const wrapper = initializeMenuStateAndReturnWrapper();

		const embedTab = wrapper.root.find( ( node ) => {
			return node.type === 'button' && node.children[ 1 ] === 'Embeds';
		} );

		embedTab.props.onClick( mockEvent );

		wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className === 'components-panel__body is-opened' &&
				node.find( ( childNode ) => {
					return childNode.type === 'button' && childNode.children[ 1 ] === 'Embeds';
				} );
		} );

		const visibleBlocks = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-block-types-list__item-title';
		} );

		expect( visibleBlocks ).toHaveLength( 2 );
		expect( visibleBlocks[ 0 ].children[ 0 ] ).toBe( 'YouTube' );
		expect( visibleBlocks[ 1 ].children[ 0 ] ).toBe( 'A Text Embed' );

		const noResultsMessage = () => wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-inserter__no-results';
		} );
		expect( noResultsMessage ).toThrow();
	} );

	it( 'should show shared items in the shared tab', () => {
		const wrapper = initializeMenuStateAndReturnWrapper();

		const sharedTab = wrapper.root.find( ( node ) => {
			return node.type === 'button' && node.children[ 2 ] === 'Shared';
		} );

		sharedTab.props.onClick( mockEvent );

		wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className === 'components-panel__body is-opened' &&
				node.find( ( childNode ) => {
					return childNode.type === 'button' && childNode.children[ 2 ] === 'Shared';
				} );
		} );

		const visibleBlocks = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-block-types-list__item-title';
		} );

		expect( visibleBlocks ).toHaveLength( 1 );
		expect( visibleBlocks[ 0 ].children[ 0 ] ).toBe( 'My shared block' );

		const noResultsMessage = () => wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-inserter__no-results';
		} );
		expect( noResultsMessage ).toThrow();
	} );

	it( 'should show the common category blocks', () => {
		const wrapper = initializeMenuStateAndReturnWrapper();

		const commonBlocksTab = wrapper.root.find( ( node ) => {
			return node.type === 'button' && node.children[ 1 ] === 'Common Blocks';
		} );

		commonBlocksTab.props.onClick( mockEvent );

		wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className === 'components-panel__body is-opened' &&
				node.find( ( childNode ) => {
					return childNode.type === 'button' && childNode.children[ 1 ] === 'Common Blocks';
				} );
		} );

		const visibleBlocks = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-block-types-list__item-title';
		} );

		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks[ 0 ].children[ 0 ] ).toBe( 'Text' );
		expect( visibleBlocks[ 1 ].children[ 0 ] ).toBe( 'Advanced Text' );
		expect( visibleBlocks[ 2 ].children[ 0 ] ).toBe( 'Some Other Block' );

		const noResultsMessage = () => wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-inserter__no-results';
		} );
		expect( noResultsMessage ).toThrow();
	} );

	it( 'should disable items with `isDisabled`', () => {
		const wrapper = renderer.create(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
				setTimeout={ noop }
			/>
		);
		const layoutTab = wrapper.root.find( ( node ) => {

			return node.type === 'button' && node.children[ 1 ] === 'Layout Elements';
		} );

		layoutTab.props.onClick( mockEvent );

		const disabledBlocks = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className.includes( 'editor-block-types-list__item' ) &&
				node.props.disabled;
		} );
		expect( disabledBlocks ).toHaveLength( 1 );
		expect( disabledBlocks[ 0 ].children[ 1 ].children[ 0 ] ).toBe( 'More' );
	} );

	it( 'should allow searching for items', () => {
		const wrapper = renderer.create(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
				setTimeout={ noop }
			/>
		);
		wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-inserter__search';
		} ).props.onChange( mockEvent.change( 'text' ) );

		// Two panels
		const panels = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className.includes( 'components-panel__body ' );
		} );
		expect( panels ).toHaveLength( 2 );

		// Matching panels expand
		const matchingCategories = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className === 'components-panel__body-toggle';
		} );
		expect( matchingCategories ).toHaveLength( 2 );
		expect( matchingCategories[ 0 ].children[ 0 ].children[ 1 ] ).toBe( 'Common Blocks' );
		expect( matchingCategories[ 1 ].children[ 0 ].children[ 1 ] ).toBe( 'Embeds' );

		const visibleBlocks = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-block-types-list__item-title';
		} );
		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks[ 0 ].children[ 0 ] ).toBe( 'Text' );
		expect( visibleBlocks[ 1 ].children[ 0 ] ).toBe( 'Advanced Text' );
		expect( visibleBlocks[ 2 ].children[ 0 ] ).toBe( 'A Text Embed' );

		const noResultsMessage = () => wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-inserter__no-results';
		} );
		expect( noResultsMessage ).toThrow();
	} );

	it( 'should trim whitespace of search terms', () => {
		const wrapper = renderer.create(
			<InserterMenu
				position={ 'top center' }
				instanceId={ 1 }
				items={ items }
				debouncedSpeak={ noop }
				fetchSharedBlocks={ noop }
				setTimeout={ noop }
			/>
		);
		wrapper.root.find( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-inserter__search';
		} ).props.onChange( mockEvent.change( ' text' ) );

		// Two panels
		const panels = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className.includes( 'components-panel__body ' );
		} );
		expect( panels ).toHaveLength( 2 );

		// Matching panels expand
		const matchingCategories = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className === 'components-panel__body-toggle';
		} );
		expect( matchingCategories ).toHaveLength( 2 );
		expect( matchingCategories[ 0 ].children[ 0 ].children[ 1 ] ).toBe( 'Common Blocks' );
		expect( matchingCategories[ 1 ].children[ 0 ].children[ 1 ] ).toBe( 'Embeds' );

		const visibleBlocks = wrapper.root.findAll( ( node ) => {
			return node.props.className &&
				node.props.className === 'editor-block-types-list__item-title';
		} );
		expect( visibleBlocks ).toHaveLength( 3 );
		expect( visibleBlocks[ 0 ].children[ 0 ] ).toBe( 'Text' );
		expect( visibleBlocks[ 1 ].children[ 0 ] ).toBe( 'Advanced Text' );
		expect( visibleBlocks[ 2 ].children[ 0 ] ).toBe( 'A Text Embed' );
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
