/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SeparatorEdit from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn(),
} ) );

const defaultAttributes = {
	backgroundColor: undefined,
	opacity: 'alpha-channel',
	style: {},
	className: '',
};
const defaultProps = {
	attributes: defaultAttributes,
	setAttributes: jest.fn(),
};

describe( 'Separator block edit method', () => {
	beforeEach( () => {
		useBlockProps.mockClear();
	} );

	test( 'should add the has-alpha-channel-opacity class and no inline styles by default', () => {
		render( <SeparatorEdit { ...defaultProps } /> );
		expect( useBlockProps ).toHaveBeenCalledWith( {
			className: 'has-alpha-channel-opacity',
			style: undefined,
		} );
	} );

	test( 'should add has-css-opacity class and no inline styles for deprecated block with no color specified', () => {
		const props = {
			...defaultProps,
			attributes: { ...defaultAttributes, opacity: 'css' },
		};
		render( <SeparatorEdit { ...props } /> );
		expect( useBlockProps ).toHaveBeenCalledWith( {
			className: 'has-css-opacity',
			style: undefined,
		} );
	} );

	test( 'should add inline background style for block without dots style selected and custom color specified', () => {
		const props = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				style: { color: { background: '#ff0000' } },
			},
		};
		render( <SeparatorEdit { ...props } /> );
		expect( useBlockProps ).toHaveBeenCalledWith( {
			// For backwards compatibility the has-text-color class is also added even though it is only needed for
			// is-style-dots as this class was always added to v1 blocks, so may be expected by themes and plugins.
			className: 'has-text-color has-alpha-channel-opacity',
			style: {
				backgroundColor: '#ff0000',
				color: undefined,
			},
		} );
	} );

	test( 'should add inline color style for block with dots style selected and custom color specified', () => {
		const props = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				className: 'is-style-dots',
				style: { color: { background: '#ff0000' } },
			},
		};
		render( <SeparatorEdit { ...props } /> );
		expect( useBlockProps ).toHaveBeenCalledWith( {
			className: 'has-text-color has-alpha-channel-opacity',
			style: {
				backgroundColor: undefined,
				color: '#ff0000',
			},
		} );
	} );

	test( 'should add color class when color from palette specified', () => {
		const props = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				backgroundColor: 'banana',
			},
		};
		render( <SeparatorEdit { ...props } /> );
		// Note that only the manual addition of the text color class can be checked as the
		// background color classes are added by useBlockProps which has to be mocked.
		expect( useBlockProps ).toHaveBeenCalledWith( {
			className:
				'has-text-color has-banana-color has-alpha-channel-opacity',
			style: undefined,
		} );
	} );
} );
