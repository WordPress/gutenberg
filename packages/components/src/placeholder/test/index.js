/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import useResizeAware from 'react-resize-aware';

/**
 * WordPress dependencies
 */
import { more } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Placeholder from '../';

jest.mock( 'react-resize-aware' );

describe( 'Placeholder', () => {
	beforeEach( () => {
		useResizeAware.mockReturnValue( [ <div key="1" />, { width: 320 } ] );
	} );

	describe( 'basic rendering', () => {
		it( 'should by default render label section and fieldset.', () => {
			const placeholder = shallow( <Placeholder /> );
			const placeholderLabel = placeholder.find(
				'.components-placeholder__label'
			);
			const placeholderInstructions = placeholder.find(
				'.components-placeholder__instructions'
			);
			const placeholderFieldset = placeholder.find(
				'.components-placeholder__fieldset'
			);

			expect( placeholder.hasClass( 'components-placeholder' ) ).toBe(
				true
			);
			// Test for empty label.
			expect( placeholderLabel.exists() ).toBe( true );
			expect( placeholderLabel.find( 'Dashicon' ).exists() ).toBe(
				false
			);
			// Test for non existant instructions.
			expect( placeholderInstructions.exists() ).toBe( false );
			// Test for empty fieldset.
			expect( placeholderFieldset.exists() ).toBe( true );
		} );

		it( 'should render an Icon in the label section', () => {
			const placeholder = shallow( <Placeholder icon={ more } /> );
			const placeholderLabel = placeholder.find(
				'.components-placeholder__label'
			);

			expect( placeholderLabel.exists() ).toBe( true );
			expect( placeholderLabel.find( 'Icon' ).exists() ).toBe( true );
		} );

		it( 'should render a label section', () => {
			const label = 'WordPress';
			const placeholder = shallow( <Placeholder label={ label } /> );
			const placeholderLabel = placeholder.find(
				'.components-placeholder__label'
			);
			const child = placeholderLabel.childAt( 1 );

			expect( child.text() ).toBe( label );
		} );

		it( 'should display an instructions element', () => {
			const element = <div>Instructions</div>;
			const placeholder = shallow(
				<Placeholder instructions={ element } />
			);
			const placeholderInstructions = placeholder.find(
				'.components-placeholder__instructions'
			);
			const child = placeholderInstructions.childAt( 0 );

			expect( placeholderInstructions.exists() ).toBe( true );
			expect( child.matchesElement( element ) ).toBe( true );
		} );

		it( 'should display a fieldset from the children property', () => {
			const element = <div>Fieldset</div>;
			const placeholder = shallow( <Placeholder children={ element } /> );
			const placeholderFieldset = placeholder.find(
				'.components-placeholder__fieldset'
			);
			const child = placeholderFieldset.childAt( 0 );

			expect( placeholderFieldset.exists() ).toBe( true );
			expect( child.matchesElement( element ) ).toBe( true );
		} );

		it( 'should add an additional className to the top container', () => {
			const placeholder = shallow(
				<Placeholder className="wp-placeholder" />
			);
			expect( placeholder.hasClass( 'wp-placeholder' ) ).toBe( true );
		} );

		it( 'should add additional props to the top level container', () => {
			const placeholder = shallow( <Placeholder test="test" /> );
			expect( placeholder.prop( 'test' ) ).toBe( 'test' );
		} );
	} );

	describe( 'resize aware', () => {
		it( 'should not assign modifier class in first-pass `null` width from `useResizeAware`', () => {
			useResizeAware.mockReturnValue( [
				<div key="1" />,
				{ width: 320 },
			] );

			const placeholder = shallow( <Placeholder /> );

			expect( placeholder.hasClass( 'is-large' ) ).toBe( true );
			expect( placeholder.hasClass( 'is-medium' ) ).toBe( false );
			expect( placeholder.hasClass( 'is-small' ) ).toBe( false );
		} );

		it( 'should assign modifier class', () => {
			useResizeAware.mockReturnValue( [
				<div key="1" />,
				{ width: null },
			] );

			const placeholder = shallow( <Placeholder /> );

			expect( placeholder.hasClass( 'is-large' ) ).toBe( false );
			expect( placeholder.hasClass( 'is-medium' ) ).toBe( false );
			expect( placeholder.hasClass( 'is-small' ) ).toBe( false );
		} );
	} );
} );
