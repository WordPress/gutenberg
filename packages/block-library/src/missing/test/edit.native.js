/**
 * External dependencies
 */
import renderer from 'react-test-renderer';
import { Text, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, Icon } from '@wordpress/components';
jest.mock( '@wordpress/blocks' );

/**
 * Internal dependencies
 */
import UnsupportedBlockEdit from '../edit.native.js';

const defaultAttributes = {
	originalName: 'missing/block/title',
};

const getTestComponentWithContent = ( attributes = defaultAttributes ) => {
	return renderer.create( <UnsupportedBlockEdit attributes={ attributes } /> );
};

describe( 'Missing block', () => {
	it( 'renders without crashing', () => {
		const component = getTestComponentWithContent();
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	describe( 'help modal', () => {
		it( 'renders help icon', () => {
			const component = getTestComponentWithContent();
			const testInstance = component.root;
			const icons = testInstance.findAllByType( Icon );
			expect( icons.length ).toBe( 2 );
			expect( icons[ 0 ].props.icon ).toBe( 'editor-help' );
		} );

		it( 'renders info icon on modal', () => {
			const component = getTestComponentWithContent();
			const testInstance = component.root;
			const bottomSheet = testInstance.findByType( BottomSheet );
			const children = bottomSheet.props.children.props.children;
			expect( children.length ).toBe( 3 ); // 4 children in the bottom sheet: the icon, the "isn't yet supported" title and the "We are working hard..." message
			expect( children[ 0 ].props.icon ).toBe( 'editor-help' );
		} );

		it( 'renders unsupported text on modal', () => {
			const component = getTestComponentWithContent();
			const testInstance = component.root;
			const bottomSheet = testInstance.findByType( BottomSheet );
			const children = bottomSheet.props.children.props.children;
			const expectedOSString = Platform.OS === 'ios' ? 'iOS' : 'Android';
			expect( children[ 1 ].props.children ).toBe( '\'' + defaultAttributes.originalName + '\' isn\'t yet supported on WordPress for ' + expectedOSString );
		} );
	} );

	it( 'renders admin plugins icon', () => {
		const component = getTestComponentWithContent();
		const testInstance = component.root;
		const icons = testInstance.findAllByType( Icon );
		expect( icons.length ).toBe( 2 );
		expect( icons[ 1 ].props.icon ).toBe( 'admin-plugins' );
	} );

	it( 'renders title text without crashing', () => {
		const component = getTestComponentWithContent();
		const testInstance = component.root;
		const texts = testInstance.findAllByType( Text );
		expect( texts.length ).toBe( 2 );
		expect( texts[ 0 ].props.children ).toBe( 'missing/block/title' );
		expect( texts[ 1 ].props.children ).toBe( 'Unsupported' );
	} );
} );
