/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { TextInput } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <TextInput /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render align', () => {
		const { container } = render( <TextInput align="flex-start" /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render disabled', () => {
		const { container } = render( <TextInput disabled /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render defaultValue', () => {
		const { container } = render( <TextInput defaultValue="Olaf" /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render gap', () => {
		const { container } = render( <TextInput gap={ 4 } /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isRounded', () => {
		const { container } = render( <TextInput isRounded /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render seamless', () => {
		const { container } = render( <TextInput seamless /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render justify', () => {
		const { container } = render( <TextInput justify="space-around" /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	// TODO: TextareaAutosizeClass is creating invalid attributes.
	test.skip( 'should render multiline', () => {
		const { container } = render( <TextInput isResizable multiline /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render prefix', () => {
		const { container } = render(
			<TextInput prefix={ <span>prefix</span> } />
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render size', () => {
		const { container } = render( <TextInput size="small" /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render suffix', () => {
		const { container } = render(
			<TextInput suffix={ <span>suffix</span> } />
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render value', () => {
		const { container } = render( <TextInput value="Olaf" /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
