/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getFormatTypes,
	getFormatType,
	getFormatTypeForBareElement,
	getFormatTypeForClassName,
} from '../selectors';

describe( 'selectors', () => {
	const formatType = {
		name: 'core/test-format',
		className: null,
		tagName: 'format',
	};
	const formatTypeClassName = {
		name: 'core/test-format-class-name',
		className: 'class-name',
		tagName: 'strong',
	};
	const formatTypeBareTag = {
		name: 'core/test-format-bare-tag',
		className: null,
		tagName: 'strong',
	};
	const defaultState = deepFreeze( {
		formatTypes: {
			'core/test-format': formatType,
			'core/test-format-class-name': formatTypeClassName,
			// Order matters: we need to ensure that
			// `core/test-format-class-name` is not considered bare.
			'core/test-format-bare-tag': formatTypeBareTag,
		},
	} );

	describe( 'getFormatTypes', () => {
		it( 'should get format types', () => {
			const expected = [
				formatType,
				formatTypeClassName,
				formatTypeBareTag,
			];
			expect( getFormatTypes( defaultState ) ).toEqual( expected );
		} );
	} );

	describe( 'getFormatType', () => {
		it( 'should get a format type', () => {
			const result = getFormatType( defaultState, 'core/test-format' );

			expect( result ).toEqual( formatType );
		} );
	} );

	describe( 'getFormatTypeForBareElement', () => {
		it( 'should get a format type', () => {
			const result = getFormatTypeForBareElement(
				defaultState,
				'strong'
			);

			expect( result ).toEqual( formatTypeBareTag );
		} );
	} );

	describe( 'getFormatTypeForClassName', () => {
		it( 'should get a format type', () => {
			const result = getFormatTypeForClassName(
				defaultState,
				'class-name'
			);

			expect( result ).toEqual( formatTypeClassName );
		} );
	} );
} );
