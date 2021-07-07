/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Spacer } from '../index';

describe( 'props', () => {
	let base;
	beforeEach( () => {
		base = render( <Spacer /> ).container;
	} );

	test( 'should render correctly', () => {
		expect( base.firstChild ).toMatchSnapshot();
	} );

	test( 'should render margin', () => {
		const { container } = render( <Spacer margin={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render marginX', () => {
		const { container } = render( <Spacer marginX={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render marginY', () => {
		const { container } = render( <Spacer marginY={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render marginTop', () => {
		const { container } = render( <Spacer marginTop={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render marginBottom', () => {
		const { container } = render( <Spacer marginBottom={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render marginLeft', () => {
		const { container } = render( <Spacer marginLeft={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render marginRight', () => {
		const { container } = render( <Spacer marginRight={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render padding', () => {
		const { container } = render( <Spacer padding={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render paddingX', () => {
		const { container } = render( <Spacer paddingX={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render paddingY', () => {
		const { container } = render( <Spacer paddingY={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render paddingTop', () => {
		const { container } = render( <Spacer paddingTop={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render paddingBottom', () => {
		const { container } = render( <Spacer paddingBottom={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render paddingLeft', () => {
		const { container } = render( <Spacer paddingLeft={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render paddingRight', () => {
		const { container } = render( <Spacer paddingRight={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );
} );
