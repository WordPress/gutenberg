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
jest.mock( '@wordpress/blocks' );
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

		describe( 'Unsupported block editor (UBE)', () => {
			beforeEach( () => {
				// By default we set the web editor as available.
				storeConfig.selectors.getSettings.mockReturnValue( {
					unsupportedBlockEditor: true,
				} );
			} );

			it( 'renders edit action if UBE is available', () => {
				const testInstance = getTestComponentWithContent();
				const bottomSheet = testInstance.UNSAFE_getByType(
					BottomSheet
				);
				const bottomSheetCells = bottomSheet.props.children[ 1 ];
				expect( bottomSheetCells ).toBeTruthy();
				expect( bottomSheetCells.props.children.length ).toBe( 2 );
				expect( bottomSheetCells.props.children[ 0 ].props.label ).toBe(
					'Edit using web editor'
				);
			} );

			it( 'does not render edit action if UBE is not available', () => {
				storeConfig.selectors.getSettings.mockReturnValue( {
					unsupportedBlockEditor: false,
				} );

				const testInstance = getTestComponentWithContent();
				const bottomSheet = testInstance.UNSAFE_getByType(
					BottomSheet
				);
				expect( bottomSheet.props.children[ 1 ] ).toBeFalsy();
			} );

			it( 'does not render edit action if the block is incompatible with UBE', () => {
				const testInstance = getTestComponentWithContent( {
					originalName: 'core/block',
				} );
				const bottomSheet = testInstance.UNSAFE_getByType(
					BottomSheet
				);
				expect( bottomSheet.props.children[ 1 ] ).toBeFalsy();
			} );
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
