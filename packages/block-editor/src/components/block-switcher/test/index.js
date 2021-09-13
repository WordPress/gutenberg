/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { DOWN } from '@wordpress/keycodes';
import { Button } from '@wordpress/components';
import { stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { BlockSwitcher, BlockSwitcherDropdownMenu } from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

describe( 'BlockSwitcher', () => {
	test( 'should not render block switcher without blocks', () => {
		useSelect.mockImplementation( () => ( {} ) );
		const wrapper = shallow( <BlockSwitcher /> );
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should not render block switcher with null blocks', () => {
		useSelect.mockImplementation( () => ( { blocks: [ null ] } ) );
		const wrapper = shallow(
			<BlockSwitcher
				clientIds={ [ 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9' ] }
			/>
		);
		expect( wrapper.html() ).toBeNull();
	} );
} );
describe( 'BlockSwitcherDropdownMenu', () => {
	const headingBlock1 = {
		attributes: {
			content: [ 'How are you?' ],
			level: 2,
		},
		isValid: true,
		name: 'core/heading',
		originalContent: '<h2>How are you?</h2>',
		clientId: 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9',
	};

	const textBlock = {
		attributes: {
			content: [ 'I am great!' ],
		},
		isValid: true,
		name: 'core/paragraph',
		originalContent: '<p>I am great!</p>',
		clientId: 'b1303fdb-3e60-43faf-a770-2e1ea656c5b8',
	};

	const headingBlock2 = {
		attributes: {
			content: [ 'I am the greatest!' ],
			level: 3,
		},
		isValid: true,
		name: 'core/heading',
		originalContent: '<h3>I am the greatest!</h3>',
		clientId: 'c2403fd2-4e63-5ffa-b71c-1e0ea656c5b0',
	};

	beforeAll( () => {
		registerBlockType( 'core/heading', {
			category: 'text',
			title: 'Heading',
			edit: () => {},
			save: () => {},
			transforms: {
				to: [
					{
						type: 'block',
						blocks: [ 'core/paragraph' ],
						transform: () => {},
					},
					{
						type: 'block',
						blocks: [ 'core/paragraph' ],
						transform: () => {},
						isMultiBlock: true,
					},
				],
			},
		} );

		registerBlockType( 'core/paragraph', {
			category: 'text',
			title: 'Paragraph',
			edit: () => {},
			save: () => {},
			transforms: {
				to: [
					{
						type: 'block',
						blocks: [ 'core/heading' ],
						transform: () => {},
					},
				],
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/heading' );
		unregisterBlockType( 'core/paragraph' );
	} );

	test( 'should render switcher with blocks', () => {
		useSelect.mockImplementation( () => ( {
			possibleBlockTransformations: [
				{ name: 'core/heading', frecency: 1 },
				{ name: 'core/paragraph', frecency: 1 },
			],
			canRemove: true,
		} ) );
		const wrapper = shallow(
			<BlockSwitcherDropdownMenu blocks={ [ headingBlock1 ] } />
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should render disabled block switcher with multi block of different types when no transforms', () => {
		useSelect.mockImplementation( () => ( {
			possibleBlockTransformations: [],
			icon: stack,
		} ) );
		const wrapper = shallow(
			<BlockSwitcherDropdownMenu
				blocks={ [ headingBlock1, textBlock ] }
			/>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should render enabled block switcher with multi block when transforms exist', () => {
		useSelect.mockImplementation( () => ( {
			possibleBlockTransformations: [
				{ name: 'core/heading', frecency: 1 },
				{ name: 'core/paragraph', frecency: 1 },
			],
			canRemove: true,
		} ) );
		const wrapper = shallow(
			<BlockSwitcherDropdownMenu
				blocks={ [ headingBlock1, headingBlock2 ] }
			/>
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	describe( 'Dropdown', () => {
		beforeAll( () => {
			useSelect.mockImplementation( () => ( {
				possibleBlockTransformations: [
					{ name: 'core/paragraph', frecency: 3 },
				],
				canRemove: true,
			} ) );
		} );
		const getDropdown = () =>
			mount(
				<BlockSwitcherDropdownMenu blocks={ [ headingBlock1 ] } />
			).find( 'Dropdown' );

		test( 'should dropdown exist', () => {
			expect( getDropdown() ).toHaveLength( 1 );
		} );

		describe( '.renderToggle', () => {
			const onToggleStub = jest.fn();
			const mockKeyDown = {
				preventDefault: () => {},
				keyCode: DOWN,
			};

			afterEach( () => {
				onToggleStub.mockReset();
			} );

			test( 'should simulate a keydown event, which should call onToggle and open transform toggle.', () => {
				const toggleClosed = mount(
					getDropdown().props().renderToggle( {
						onToggle: onToggleStub,
						isOpen: false,
					} )
				);
				const iconButtonClosed = toggleClosed.find( Button );

				iconButtonClosed.simulate( 'keydown', mockKeyDown );

				expect( onToggleStub ).toHaveBeenCalledTimes( 1 );
			} );

			test( 'should simulate a click event, which should call onToggle.', () => {
				const toggleOpen = mount(
					getDropdown().props().renderToggle( {
						onToggle: onToggleStub,
						isOpen: true,
					} )
				);
				const iconButtonOpen = toggleOpen.find( Button );

				iconButtonOpen.simulate( 'keydown', mockKeyDown );

				expect( onToggleStub ).toHaveBeenCalledTimes( 0 );
			} );
		} );

		describe( '.renderContent', () => {
			test( 'should create the transform items for the chosen block. A heading block will have 3 items', () => {
				const onCloseStub = jest.fn();
				const content = shallow(
					<div>
						{ getDropdown()
							.props()
							.renderContent( { onClose: onCloseStub } ) }
					</div>
				);
				const blockList = content.find( 'BlockTransformationsMenu' );
				expect(
					blockList.prop( 'possibleBlockTransformations' )
				).toHaveLength( 1 );
			} );
		} );
	} );
} );
