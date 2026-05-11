/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import flex from '../flex';

const FlexLayoutInspectorControls = flex.inspectorControls;

describe( 'getLayoutStyle', () => {
	it( 'should return an empty string if no non-default params are provided', () => {
		const expected = '';

		const result = flex.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
} );

describe( 'FlexLayoutInspectorControls', () => {
	it( 'should render the wrap toggle by default', () => {
		render(
			<FlexLayoutInspectorControls layout={ {} } onChange={ jest.fn() } />
		);

		expect(
			screen.getByRole( 'checkbox', {
				name: 'Allow to wrap to multiple lines',
			} )
		).toBeInTheDocument();
	} );

	it( 'should render the wrap toggle when allowWrap is true', () => {
		render(
			<FlexLayoutInspectorControls
				layout={ {} }
				onChange={ jest.fn() }
				layoutBlockSupport={ { allowWrap: true } }
			/>
		);

		expect(
			screen.getByRole( 'checkbox', {
				name: 'Allow to wrap to multiple lines',
			} )
		).toBeInTheDocument();
	} );

	it( 'should not render the wrap toggle when allowWrap is false', () => {
		render(
			<FlexLayoutInspectorControls
				layout={ {} }
				onChange={ jest.fn() }
				layoutBlockSupport={ { allowWrap: false } }
			/>
		);

		expect(
			screen.queryByRole( 'checkbox', {
				name: 'Allow to wrap to multiple lines',
			} )
		).not.toBeInTheDocument();
	} );
} );
