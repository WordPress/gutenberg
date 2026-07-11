import { render, screen } from '@testing-library/react';

import { Spacer } from '../index';
import styles from '../style.module.scss';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render( <Spacer data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toMatchSnapshot();
	} );

	test( 'should render margin', () => {
		render( <Spacer margin={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin': 'calc(4px * 5)',
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
		} );
	} );

	test( 'should render marginX', () => {
		render( <Spacer marginX={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-inline-start': 'calc(4px * 5)',
			'--wp-components-spacer-margin-inline-end': 'calc(4px * 5)',
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
		} );
	} );

	test( 'should render marginY', () => {
		render( <Spacer marginY={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-start': 'calc(4px * 5)',
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
		} );
	} );

	test( 'should render marginTop', () => {
		render( <Spacer marginTop={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-start': 'calc(4px * 5)',
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
		} );
	} );

	test( 'should render marginBottom', () => {
		render( <Spacer marginBottom={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-end': 'calc(4px * 5)',
		} );
	} );

	test( 'should render marginLeft', () => {
		render( <Spacer marginLeft={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-inline-start': 'calc(4px * 5)',
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
		} );
	} );

	test( 'should render marginRight', () => {
		render( <Spacer marginRight={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-inline-end': 'calc(4px * 5)',
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
		} );
	} );

	test( 'should override margin props from less to more specific', () => {
		render(
			<Spacer
				margin={ 10 }
				marginX={ 3 }
				marginRight={ 5 }
				marginBottom={ 1 }
				data-testid="spacer"
			/>
		);

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin': 'calc(4px * 10)',
			'--wp-components-spacer-margin-inline-start': 'calc(4px * 3)',
			'--wp-components-spacer-margin-inline-end': 'calc(4px * 5)',
			'--wp-components-spacer-margin-block-end': 'calc(4px * 1)',
		} );
	} );

	test( 'should render padding', () => {
		render( <Spacer padding={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
			'--wp-components-spacer-padding': 'calc(4px * 5)',
		} );
	} );

	test( 'should render paddingX', () => {
		render( <Spacer paddingX={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
			'--wp-components-spacer-padding-inline-start': 'calc(4px * 5)',
			'--wp-components-spacer-padding-inline-end': 'calc(4px * 5)',
		} );
	} );

	test( 'should render paddingY', () => {
		render( <Spacer paddingY={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
			'--wp-components-spacer-padding-block-start': 'calc(4px * 5)',
			'--wp-components-spacer-padding-block-end': 'calc(4px * 5)',
		} );
	} );

	test( 'should render paddingTop', () => {
		render( <Spacer paddingTop={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
			'--wp-components-spacer-padding-block-start': 'calc(4px * 5)',
		} );
	} );

	test( 'should render paddingBottom', () => {
		render( <Spacer paddingBottom={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
			'--wp-components-spacer-padding-block-end': 'calc(4px * 5)',
		} );
	} );

	test( 'should render paddingLeft', () => {
		render( <Spacer paddingLeft={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
			'--wp-components-spacer-padding-inline-start': 'calc(4px * 5)',
		} );
	} );

	test( 'should render paddingRight', () => {
		render( <Spacer paddingRight={ 5 } data-testid="spacer" /> );

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
			'--wp-components-spacer-padding-inline-end': 'calc(4px * 5)',
		} );
	} );

	test( 'should override padding props from less to more specific', () => {
		render(
			<Spacer
				padding={ 10 }
				paddingY={ 2 }
				paddingTop={ 5 }
				paddingLeft={ 3 }
				data-testid="spacer"
			/>
		);

		expect( screen.getByTestId( 'spacer' ) ).toHaveStyle( {
			'--wp-components-spacer-margin-block-end': 'calc(4px * 2)',
			'--wp-components-spacer-padding': 'calc(4px * 10)',
			'--wp-components-spacer-padding-block-start': 'calc(4px * 5)',
			'--wp-components-spacer-padding-block-end': 'calc(4px * 2)',
			'--wp-components-spacer-padding-inline-start': 'calc(4px * 3)',
		} );
	} );

	test( 'should render nested instances without passing spacing variables to children', () => {
		render(
			<Spacer padding={ 4 } data-testid="outer-spacer">
				<Spacer data-testid="inner-spacer" />
			</Spacer>
		);

		const outerSpacer = screen.getByTestId( 'outer-spacer' );
		const innerSpacer = screen.getByTestId( 'inner-spacer' );

		expect( outerSpacer ).toHaveClass( styles.spacer );
		expect( innerSpacer ).toHaveClass( styles.spacer );
		expect(
			outerSpacer.style.getPropertyValue(
				'--wp-components-spacer-padding'
			)
		).toBe( 'calc(4px * 4)' );
		expect(
			innerSpacer.style.getPropertyValue(
				'--wp-components-spacer-padding'
			)
		).toBe( '' );
	} );
} );
