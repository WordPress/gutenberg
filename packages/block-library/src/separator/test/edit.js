/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

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
	InspectorControls: ( { children } ) => <>{ children }</>,
} ) );

const defaultAttributes = {
	backgroundColor: undefined,
	opacity: 'alpha-channel',
	style: {},
	className: '',
	tagName: 'hr',
	isDecorative: true,
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
			className:
				'has-text-color has-alpha-channel-opacity has-background',
			style: {
				backgroundColor: '#ff0000',
				color: '#ff0000',
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
			className:
				'has-text-color has-alpha-channel-opacity has-background',
			style: {
				backgroundColor: '#ff0000',
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
				'has-text-color has-banana-color has-alpha-channel-opacity has-banana-background-color has-background',
			style: undefined,
		} );
	} );

	describe( 'isDecorative and tagName controls', () => {
		test( 'should render a decorative toggle when tagName is hr', () => {
			render( <SeparatorEdit { ...defaultProps } /> );
			expect(
				screen.getByRole( 'checkbox', {
					name: /Decorative separator/i,
				} )
			).toBeInTheDocument();
		} );

		test( 'should call setAttributes with updated isDecorative when toggle is changed', () => {
			const setAttributes = jest.fn();
			const props = {
				...defaultProps,
				setAttributes,
				attributes: { ...defaultAttributes, isDecorative: true },
			};
			render( <SeparatorEdit { ...props } /> );
			const toggle = screen.getByRole( 'checkbox', {
				name: /Decorative separator/i,
			} );
			fireEvent.click( toggle );
			expect( setAttributes ).toHaveBeenCalledWith( {
				isDecorative: false,
			} );
		} );

		test( 'should not render decorative toggle when tagName is div', () => {
			const props = {
				...defaultProps,
				attributes: { ...defaultAttributes, tagName: 'div' },
			};
			render( <SeparatorEdit { ...props } /> );
			expect(
				screen.queryByRole( 'checkbox', {
					name: /Decorative separator/i,
				} )
			).not.toBeInTheDocument();
		} );

		test( 'should render info notice when tagName is div', () => {
			const props = {
				...defaultProps,
				attributes: { ...defaultAttributes, tagName: 'div' },
			};
			render( <SeparatorEdit { ...props } /> );
			// Notice renders text in both the visible node and an aria-live
			// announcer region, so use getAllByText and check at least one match.
			expect(
				screen.getAllByText(
					/Non-HR elements are automatically decorative/i
				)[ 0 ]
			).toBeInTheDocument();
		} );

		test( 'should set isDecorative to true when switching to div via HtmlElementControl', () => {
			const setAttributes = jest.fn();
			const props = { ...defaultProps, setAttributes };
			render( <SeparatorEdit { ...props } /> );
			const select = screen.getByRole( 'combobox', {
				name: /HTML element/i,
			} );
			fireEvent.change( select, { target: { value: 'div' } } );
			expect( setAttributes ).toHaveBeenCalledWith( { tagName: 'div' } );
			expect( setAttributes ).toHaveBeenCalledWith( {
				isDecorative: true,
			} );
		} );
	} );
} );
