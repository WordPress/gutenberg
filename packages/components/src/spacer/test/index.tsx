/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Spacer } from '../index';

describe( 'props', () => {
	beforeEach( () => {
		render( <Spacer data-testid="spacer" /> );
	} );

	test( 'should render correctly', () => {
		expect( screen.getByTestId( 'spacer' ) ).toMatchSnapshot();
	} );

	test( 'should render margin', () => {
		render( <Spacer margin={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render marginX', () => {
		render( <Spacer marginX={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render marginY', () => {
		render( <Spacer marginY={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render marginTop', () => {
		render( <Spacer marginTop={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render marginBottom', () => {
		render( <Spacer marginBottom={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render marginLeft', () => {
		render( <Spacer marginLeft={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render marginRight', () => {
		render( <Spacer marginRight={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should override margin props from less to more specific', () => {
		render(
			<Spacer
				margin={ 10 }
				marginX={ 3 }
				marginRight={ 5 }
				marginBottom={ 1 }
				data-testid="customized-spacer"
			/>
		);
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render padding', () => {
		render( <Spacer padding={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render paddingX', () => {
		render( <Spacer paddingX={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render paddingY', () => {
		render( <Spacer paddingY={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render paddingTop', () => {
		render( <Spacer paddingTop={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render paddingBottom', () => {
		render(
			<Spacer paddingBottom={ 5 } data-testid="customized-spacer" />
		);
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render paddingLeft', () => {
		render( <Spacer paddingLeft={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should render paddingRight', () => {
		render( <Spacer paddingRight={ 5 } data-testid="customized-spacer" /> );
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );

	test( 'should override padding props from less to more specific', () => {
		render(
			<Spacer
				padding={ 10 }
				paddingY={ 2 }
				paddingTop={ 5 }
				paddingLeft={ 3 }
				data-testid="customized-spacer"
			/>
		);
		expect(
			screen.getByTestId( 'customized-spacer' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'spacer' ) );
	} );
} );
