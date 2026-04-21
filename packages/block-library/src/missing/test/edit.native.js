/**
 * External dependencies
 */
import { render } from 'test/helpers';
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, Icon } from '@wordpress/components';
import { help, plugins } from '@wordpress/icons';
import { storeConfig } from '@wordpress/block-editor';
jest.mock( '@wordpress/block-editor/src/store/selectors' );

/**
 * Internal dependencies
 */
import UnsupportedBlockEdit from '../edit.native.js';

const defaultAttributes = {
	originalName: 'missing/block/title',
};

const getTestComponentWithContent = ( attributes = defaultAttributes ) => {
	return render( <UnsupportedBlockEdit attributes={ attributes } /> );
};

describe( 'Missing block', () => {
	beforeEach( () => {
		storeConfig.selectors.getSettings.mockReturnValue( {} );
	} );

	it( 'renders without crashing', () => {
		const testInstance = getTestComponentWithContent();
		const rendered = testInstance.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	describe( 'help modal', () => {
		it( 'renders help icon', () => {
			const testInstance = getTestComponentWithContent();
			const icons = testInstance.UNSAFE_getAllByType( Icon );
			expect( icons.length ).toBe( 2 );
			expect( icons[ 0 ].props.icon ).toBe( help );
		} );

		it( 'renders info icon on modal', () => {
			const testInstance = getTestComponentWithContent();
			const bottomSheet = testInstance.UNSAFE_getByType( BottomSheet );
			const children = bottomSheet.props.children[ 0 ].props.children;
			expect( children.length ).toBe( 3 ); // 4 children in the bottom sheet: the icon, the "isn't yet supported" title and the "We are working hard..." message.
			expect( children[ 0 ].props.icon ).toBe( help );
		} );

		it( 'renders unsupported text on modal', () => {
			const testInstance = getTestComponentWithContent();
			const bottomSheet = testInstance.UNSAFE_getByType( BottomSheet );
			const children = bottomSheet.props.children[ 0 ].props.children;
			expect( children[ 1 ].props.children ).toBe(
				"'" +
					defaultAttributes.originalName +
					"' is not fully-supported"
			);
		} );
	} );

	it( 'renders admin plugins icon', () => {
		const testInstance = getTestComponentWithContent();
		const icons = testInstance.UNSAFE_getAllByType( Icon );
		expect( icons.length ).toBe( 2 );
		expect( icons[ 1 ].props.icon ).toBe( plugins );
	} );

	it( 'renders title text without crashing', () => {
		const testInstance = getTestComponentWithContent();
		const texts = testInstance.UNSAFE_getAllByType( Text );
		expect( texts.length ).toBe( 2 );
		expect( texts[ 0 ].props.children ).toBe( 'missing/block/title' );
		expect( texts[ 1 ].props.children ).toBe( 'Unsupported' );
	} );
} );
