/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Editable from '../';
import { diffAriaProps, pickAriaProps } from '../aria';

describe( 'Editable', () => {
	describe( 'Component', () => {
		describe( '.proxyPropHandler', () => {
			// Add tests.
			const onChange = jest.fn();
			const wrapper = shallow( <Editable value={ [ 'value' ] } onChange={ onChange } /> );

			beforeEach( () => {
				onChange.mockClear();
			} );

			test( 'should return undefined when trying to proxy onFocus', () => {
				// When trying to override onFocus, via Focus, this method should return null until issue below is resolved.
				// TODO: Reconcile with `onFocus` instance handler which does not
				// pass the event object. Otherwise we have double focus handling
				// and editor instance being stored into state.
				expect( wrapper.instance().proxyPropHandler( 'Focus' )( {} ) ).toBeUndefined();
			} );

			test( 'should call the event handler provided via props', () => {
				wrapper.instance().proxyPropHandler( 'Change' )( {} );

				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChange ).toHaveBeenCalledWith( {} );
			} );

			test( 'should not call the event handler when not existent proxyPropHandler is used', () => {
				wrapper.instance().proxyPropHandler( 'DoesNotExist' )( {} );

				expect( onChange ).toHaveBeenCalledTimes( 0 );
			} );
		} );
	} );
	describe( '.propTypes', () => {
		/* eslint-disable no-console */
		let consoleError;
		beforeEach( () => {
			consoleError = console.error;
			console.error = jest.fn();
		} );

		afterEach( () => {
			console.error = consoleError;
		} );

		it( 'should warn when rendered with string value', () => {
			shallow( <Editable value="Uh oh!" /> );

			expect( console.error ).toHaveBeenCalled();
		} );

		it( 'should not warn when rendered with undefined value', () => {
			shallow( <Editable /> );

			expect( console.error ).not.toHaveBeenCalled();
		} );

		it( 'should not warn when rendered with array value', () => {
			shallow( <Editable value={ [ 'Oh, good' ] } /> );

			expect( console.error ).not.toHaveBeenCalled();
		} );
		/* eslint-enable no-console */
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
