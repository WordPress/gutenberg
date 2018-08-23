/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	RichText,
	getFormatValue,
} from '../';
import { diffAriaProps, pickAriaProps } from '../aria';

jest.mock( '@wordpress/deprecated', () => jest.fn() );

describe( 'getFormatValue', () => {
	function createMockNode( nodeName, attributes = {} ) {
		return {
			nodeName,
			hasAttribute( name ) {
				return !! attributes[ name ];
			},
			getAttribute( name ) {
				return attributes[ name ];
			},
		};
	}

	test( 'basic formatting', () => {
		expect( getFormatValue( 'bold' ) ).toEqual( {
			isActive: true,
		} );
	} );

	test( 'link formatting when no anchor is found', () => {
		const formatValue = getFormatValue( 'link', [
			createMockNode( 'P' ),
		] );
		expect( formatValue ).toEqual( {
			isActive: true,
		} );
	} );

	test( 'link formatting', () => {
		const mockNode = createMockNode( 'A', {
			href: 'https://www.testing.com',
			target: '_blank',
		} );

		const formatValue = getFormatValue( 'link', [ mockNode ] );

		expect( formatValue ).toEqual( {
			isActive: true,
			value: 'https://www.testing.com',
			target: '_blank',
			node: mockNode,
		} );
	} );

	test( 'link formatting when the anchor has no attributes', () => {
		const mockNode = createMockNode( 'A' );

		const formatValue = getFormatValue( 'link', [ mockNode ] );

		expect( formatValue ).toEqual( {
			isActive: true,
			value: '',
			target: '',
			node: mockNode,
		} );
	} );

	test( 'link formatting when the link is still being added', () => {
		const formatValue = getFormatValue( 'link', [
			createMockNode( 'A', {
				href: '#',
				'data-wp-placeholder': 'true',
				'data-mce-bogus': 'true',
			} ),
		] );
		expect( formatValue ).toEqual( {
			isAdding: true,
		} );
	} );
} );

describe( 'RichText', () => {
	describe( 'Component', () => {
		describe( '.adaptFormatter', () => {
			const wrapper = shallow( <RichText value={ [ 'valid' ] } /> );
			const options = {
				type: 'inline-style',
				style: {
					'font-weight': '600',
				},
			};

			test( 'should return an object on inline: span, and a styles property matching the style object provided', () => {
				expect( wrapper.instance().adaptFormatter( options ) ).toEqual( {
					inline: 'span',
					styles: options.style,
				} );
			} );
		} );
		describe( '.getSettings', () => {
			const value = [ 'Hi!' ];
			const settings = {
				setting: 'hi',
			};

			test( 'should return expected settings', () => {
				const wrapper = shallow( <RichText value={ value } /> );
				expect( wrapper.instance().getSettings( settings ) ).toEqual( {
					setting: 'hi',
					forced_root_block: false,
					custom_undo_redo_levels: 1,
				} );
			} );

			test( 'should be overriden (deprecated)', () => {
				const mock = jest.fn().mockImplementation( () => 'mocked' );

				expect( shallow( <RichText value={ value } multiline={ true } getSettings={ mock } /> ).instance().getSettings( settings ) ).toEqual( 'mocked' );
				expect( deprecated ).toHaveBeenCalled();
			} );

			test( 'should be overriden', () => {
				const mock = jest.fn().mockImplementation( () => 'mocked' );

				expect( shallow( <RichText value={ value } multiline={ true } unstableGetSettings={ mock } /> ).instance().getSettings( settings ) ).toEqual( 'mocked' );
			} );
		} );
	} );

	describe( 'pickAriaProps()', () => {
		it( 'should should filter all properties to only those begining with "aria-"', () => {
			expect( pickAriaProps( {
				tagName: 'p',
				className: 'class1 class2',
				'aria-label': 'my label',
				style: {
					backgroundColor: 'white',
					color: 'black',
					fontSize: '12px',
					textAlign: 'left',
				},
				'aria-owns': 'some-id',
				'not-aria-prop': 'value',
				ariaWithoutDash: 'value',
			} ) ).toEqual( {
				'aria-label': 'my label',
				'aria-owns': 'some-id',
			} );
		} );
	} );
	describe( 'diffAriaProps()', () => {
		it( 'should report empty arrays for no props', () => {
			expect( diffAriaProps( {}, {} ) ).toEqual( {
				removedKeys: [],
				updatedKeys: [],
			} );
		} );
		it( 'should report empty arrays for non-aria props', () => {
			expect( diffAriaProps( {
				'non-aria-prop': 'old value',
				'removed-prop': 'value',
			}, {
				'non-aria-prop': 'new value',
				'added-prop': 'value',
			} ) ).toEqual( {
				removedKeys: [],
				updatedKeys: [],
			} );
		} );
		it( 'should report added aria props', () => {
			expect( diffAriaProps( {
			}, {
				'aria-prop': 'value',
			} ) ).toEqual( {
				removedKeys: [],
				updatedKeys: [ 'aria-prop' ],
			} );
		} );
		it( 'should report removed aria props', () => {
			expect( diffAriaProps( {
				'aria-prop': 'value',
			}, {
			} ) ).toEqual( {
				removedKeys: [ 'aria-prop' ],
				updatedKeys: [],
			} );
		} );
		it( 'should report changed aria props', () => {
			expect( diffAriaProps( {
				'aria-prop': 'old value',
			}, {
				'aria-prop': 'new value',
			} ) ).toEqual( {
				removedKeys: [],
				updatedKeys: [ 'aria-prop' ],
			} );
		} );
		it( 'should not report unchanged aria props', () => {
			expect( diffAriaProps( {
				'aria-prop': 'value',
			}, {
				'aria-prop': 'value',
			} ) ).toEqual( {
				removedKeys: [],
				updatedKeys: [],
			} );
		} );
		it( 'should work with a mixture of aria and non-aria props', () => {
			expect( diffAriaProps( {
				tagName: 'p',
				className: 'class1 class2',
				'aria-label': 'my label',
				style: {
					backgroundColor: 'white',
					color: 'black',
					fontSize: '12px',
					textAlign: 'left',
				},
				'aria-owns': 'some-id',
				'aria-active': 'some-active-id',
				'not-aria-prop': 'old value',
			}, {
				tagName: 'div',
				className: 'class1 class2',
				style: {
					backgroundColor: 'red',
					color: 'black',
					fontSize: '12px',
				},
				'aria-active': 'some-other-active-id',
				'not-aria-prop': 'new value',
				'aria-label': 'my label',
			} ) ).toEqual( {
				removedKeys: [ 'aria-owns' ],
				updatedKeys: [ 'aria-active' ],
			} );
		} );
	} );
} );
