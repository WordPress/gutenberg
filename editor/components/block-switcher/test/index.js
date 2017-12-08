/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { BlockSwitcher } from '../';

const { DOWN } = keycodes;

describe( 'BlockSwitcher', () => {
	const headingBlock1 = {
		attributes: {
			content: [ 'How are you?' ],
			nodeName: 'H2',
		},
		isValid: true,
		name: 'core/heading',
		originalContent: '<h2>How are you?</h2>',
		uid: 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9',
	};

	const textBlock = {
		attributes: {
			content: [ 'I am great!' ],
			nodeName: 'P',
		},
		isValid: true,
		name: 'core/text',
		originalContent: '<p>I am great!</p>',
		uid: 'b1303fd6-3e60-4fff-a770-0e0ea656c5b9',
	};

	const headingBlock2 = {
		attributes: {
			content: [ 'I am great!' ],
			nodeName: 'H3',
		},
		isValid: true,
		name: 'core/heading',
		originalContent: '<h3>I am great!</h3>',
		uid: 'b1303fd6-3e60-4fff-a770-0e0ea656c5b9',
	};

	test( 'Test block switcher without blocks', () => {
		expect( shallow( <BlockSwitcher /> ).html() ).toBeNull();
	} );
	test( 'Test block switcher with blocks', () => {
		const blocks = [
			headingBlock1,
		];

		expect( shallow( <BlockSwitcher blocks={ blocks } /> ) ).toMatchSnapshot();
	} );

	test( 'Test block switcher with multi block of different types.', () => {
		const blocks = [
			headingBlock1,
			textBlock,
		];

		expect( shallow( <BlockSwitcher blocks={ blocks } /> ).html() ).toBeNull();
	} );

	test( 'should render a component when the multi selected types of blocks match.', () => {
		const blocks = [
			headingBlock1,
			headingBlock2,
		];

		expect( shallow( <BlockSwitcher blocks={ blocks } /> ).html() ).toBeNull();
	} );

	describe( 'Dropdown', () => {
		const blocks = [
			headingBlock1,
		];

		const onTransform = jest.fn();

		const blockSwitcher = shallow( <BlockSwitcher blocks={ blocks } onTransform={ onTransform } /> );
		const dropdown = blockSwitcher.find( 'Dropdown' );

		test( 'should exist', () => {
			expect( dropdown.length ).toBe( 1 );
		} );

		describe( '.renderToggle', () => {
			// Create a stub for the onToggle callback.
			const onToggle = jest.fn();
			const mockKeyDown = {
				preventDefault: () => {},
				stopPropagation: () => {},
				keyCode: DOWN,
			};

			test( 'should simulate a keydown event, which should call onToggle and open transform toggle.', () => {
				const toggleClosed = shallow( dropdown.props().renderToggle( { onToggle, isOpen: false } ) );
				const iconButtonClosed = toggleClosed.find( 'IconButton' );

				iconButtonClosed.simulate( 'keydown', mockKeyDown );
				expect( onToggle ).toHaveBeenCalledTimes( 1 );

				// Reset onToggle stub.
				onToggle.mockClear();
			} );

			test( 'should simulate a click event, which should call onToggle.', () => {
				const toggleOpen = shallow( dropdown.props().renderToggle( { onToggle, isOpen: true } ) );
				const iconButtonOpen = toggleOpen.find( 'IconButton' );

				iconButtonOpen.simulate( 'keydown', mockKeyDown );
				expect( onToggle ).toHaveBeenCalledTimes( 0 );

				// Reset onToggle stub.
				onToggle.mockClear();
			} );
		} );

		describe( '.renderContent', () => {
			// Create a stub for the onClose callback.
			const onClose = jest.fn();

			const content = shallow( dropdown.props().renderContent( { onClose } ) );
			const iconButtons = content.find( 'IconButton' );

			test( 'should create the iconButtons for the chosen block. A heading block will have 2', () => {
				expect( iconButtons.length ).toBe( 2 );
			} );

			test( 'should simulate the click event by closing the switcher and causing a block transform on iconButtons.', () => {
				iconButtons.first().simulate( 'click' );
				expect( onClose ).toHaveBeenCalledTimes( 1 );
				expect( onTransform ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );
} );
