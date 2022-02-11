/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { more } from '@wordpress/icons';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Placeholder from '../';

describe( 'Placeholder', () => {
	beforeEach( () => {
		useResizeObserver.mockReturnValue( [
			<div key="1" />,
			{ width: 320 },
		] );
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
				'fieldset.components-placeholder__fieldset'
			);
			const child = placeholderFieldset.childAt( 0 );

			expect( placeholderFieldset.exists() ).toBe( true );
			expect( child.matchesElement( element ) ).toBe( true );
		} );

		it( 'should display a legend if instructions are passed', () => {
			const element = <div>Fieldset</div>;
			const instructions = 'Choose an option.';
			const placeholder = shallow(
				<Placeholder
					children={ element }
					instructions={ instructions }
				/>
			);
			const placeholderLegend = placeholder.find(
				'legend.components-placeholder__instructions'
			);

			expect( placeholderLegend.exists() ).toBe( true );
			expect( placeholderLegend.text() ).toEqual( instructions );
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
		it( 'should not assign modifier class in first-pass `null` width from `useResizeObserver`', () => {
			useResizeObserver.mockReturnValue( [
				<div key="1" />,
				{ width: 480 },
			] );

			const placeholder = shallow( <Placeholder /> );

			expect( placeholder.hasClass( 'is-large' ) ).toBe( true );
			expect( placeholder.hasClass( 'is-medium' ) ).toBe( false );
			expect( placeholder.hasClass( 'is-small' ) ).toBe( false );
		} );

		it( 'should assign modifier class', () => {
			useResizeObserver.mockReturnValue( [
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
