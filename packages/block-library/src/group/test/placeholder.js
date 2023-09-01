/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useShouldShowPlaceHolder } from '../placeholder';

describe( 'useShouldShowPlaceHolder', () => {
	function renderTestComponent( ...props ) {
		let returnVal = [];
		function TestComponent() {
			returnVal = returnVal.concat(
				useShouldShowPlaceHolder( ...props )
			);
			return null;
		}
		render( <TestComponent /> );
		return returnVal;
	}

	test.each( [
		{
			attributes: {},
			usedLayoutType: undefined,
			hasInnerBlocks: undefined,
			expectedValue: true,
		},
		{
			attributes: { style: { something: 'something' } },
			usedLayoutType: undefined,
			hasInnerBlocks: undefined,
			expectedValue: false,
		},
		{
			attributes: { backgroundColor: 'red' },
			usedLayoutType: undefined,
			hasInnerBlocks: true,
			expectedValue: false,
		},
		{
			attributes: { fontSize: 'big' },
			usedLayoutType: undefined,
			hasInnerBlocks: true,
			expectedValue: false,
		},
		{
			attributes: { textColor: 'yellow' },
			usedLayoutType: undefined,
			hasInnerBlocks: true,
			expectedValue: false,
		},
		{
			attributes: undefined,
			usedLayoutType: 'flex',
			hasInnerBlocks: undefined,
			expectedValue: false,
		},
		{
			attributes: undefined,
			usedLayoutType: undefined,
			hasInnerBlocks: true,
			expectedValue: false,
		},
	] )(
		'should return $expectedValue for `showPlaceholder` when hasInnerBlocks is $hasInnerBlocks, usedLayoutType is $usedLayoutType and attributes is $attributes',
		( { hasInnerBlocks, usedLayoutType, attributes, expectedValue } ) => {
			const [ showPlaceholder ] = renderTestComponent( {
				hasInnerBlocks,
				usedLayoutType,
				attributes,
			} );
			expect( showPlaceholder ).toBe( expectedValue );
		}
	);
} );
