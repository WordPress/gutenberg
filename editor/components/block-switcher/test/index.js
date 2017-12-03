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
	test( 'Test block switcher without blocks', () => {
		expect( shallow( <BlockSwitcher /> ) ).toMatchSnapshot();
	} );
	test( 'Test block switcher with blocks', () => {
		const block = {
			attributes: {
				content: [ 'How are you?' ],
				nodeName: 'H2',
			},
			isValid: true,
			name: 'core/heading',
			originalContent: '<h2>How are you?</h2>',
			uid: 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9',
		};

		const blocks = [
			block,
		];

		expect( shallow( <BlockSwitcher blocks={ blocks } /> ) ).toMatchSnapshot();
	} );

	test( 'Test block switcher with multi block of different types.', () => {
		const block1 = {
			attributes: {
				content: [ 'How are you?' ],
				nodeName: 'H2',
			},
			isValid: true,
			name: 'core/heading',
			originalContent: '<h2>How are you?</h2>',
			uid: 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9',
		};

		const block2 = {
			attributes: {
				content: [ 'I am great!' ],
				nodeName: 'P',
			},
			isValid: true,
			name: 'core/text',
			originalContent: '<p>I am great!</p>',
			uid: 'b1303fd6-3e60-4fff-a770-0e0ea656c5b9',
		};

		const blocks = [
			block1,
			block2,
		];

		expect( shallow( <BlockSwitcher blocks={ blocks } /> ) ).toMatchSnapshot();
	} );

	test( 'Test block switcher with multi block of same types.', () => {
		const block1 = {
			attributes: {
				content: [ 'How are you?' ],
				nodeName: 'H2',
			},
			isValid: true,
			name: 'core/heading',
			originalContent: '<h2>How are you?</h2>',
			uid: 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9',
		};

		const block2 = {
			attributes: {
				content: [ 'I am great!' ],
				nodeName: 'H3',
			},
			isValid: true,
			name: 'core/heading',
			originalContent: '<h3>I am great!</h3>',
			uid: 'b1303fd6-3e60-4fff-a770-0e0ea656c5b9',
		};

		const blocks = [
			block1,
			block2,
		];

		expect( shallow( <BlockSwitcher blocks={ blocks } /> ) ).toMatchSnapshot();
	} );

	test( 'should have inner components that work as expected.', () => {
		const block1 = {
			attributes: {
				content: [ 'How are you?' ],
				nodeName: 'H2',
			},
			isValid: true,
			name: 'core/heading',
			originalContent: '<h2>How are you?</h2>',
			uid: 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9',
		};

		const blocks = [
			block1,
		];

		const blockSwitcher = shallow( <BlockSwitcher blocks={ blocks } /> );

		expect( blockSwitcher.find( 'Dropdown' ).length ).toBe( 1 );

		const dropdown = blockSwitcher.find( 'Dropdown' );

		// Create a stub for the onToggle callback.
		let onToggle = jest.fn();

		const toggleClosed = shallow( dropdown.props().renderToggle( { onToggle, isOpen: false } ) );
		let iconButton = toggleClosed.find( 'IconButton' );

		let mockKeyDown = {
			preventDefault: () => {},
			stopPropagation: () => {},
			keyCode: DOWN,
		};

		iconButton.simulate( 'keydown', mockKeyDown );
		expect( onToggle ).toHaveBeenCalledTimes( 1 );

		// Create a new onToggle stub.
		onToggle = jest.fn();

		const toggleOpen = shallow( dropdown.props().renderToggle( { onToggle, isOpen: true } ) );
		iconButton = toggleOpen.find( 'IconButton' );

		mockKeyDown = {
			preventDefault: () => {},
			stopPropagation: () => {},
			keyCode: DOWN,
		};

		iconButton.simulate( 'keydown', mockKeyDown );
		expect( onToggle ).toHaveBeenCalledTimes( 0 );
	} );

	describe( '.renderContent', () => {
		test( 'should work as expected', () => {
			const block1 = {
				attributes: {
					content: [ 'How are you?' ],
					nodeName: 'H2',
				},
				isValid: true,
				name: 'core/heading',
				originalContent: '<h2>How are you?</h2>',
				uid: 'a1303fd6-3e60-4fff-a770-0e0ea656c5b9',
			};

			const blocks = [
				block1,
			];

			const onTransform = jest.fn();

			const blockSwitcher = shallow( <BlockSwitcher blocks={ blocks } onTransform={ onTransform } /> );

			expect( blockSwitcher.find( 'Dropdown' ).length ).toBe( 1 );

			const dropdown = blockSwitcher.find( 'Dropdown' );

			// Create a stub for the onClose callback.
			const onClose = jest.fn();

			const content = shallow( dropdown.props().renderContent( { onClose } ) );
			const iconButtons = content.find( 'IconButton' );
			expect( iconButtons.length ).toBe( 2 );

			// When clicked the transformation window should close and transform the block.
			iconButtons.first().simulate( 'click' );
			expect( onClose ).toHaveBeenCalledTimes( 1 );
			expect( onTransform ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
