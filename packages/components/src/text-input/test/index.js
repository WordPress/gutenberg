/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { TextInput } from '../index';

describe( 'props', () => {
	let base;

	beforeEach( () => {
		( { container: base } = render( <TextInput /> ) );
	} );
	test( 'should render correctly', () => {
		expect( base.firstChild ).toMatchSnapshot();
	} );

	test( 'should render disabled', () => {
		const { container } = render( <TextInput disabled /> );
		expect( container.firstChild ).toMatchDiffSnapshot( base.firstChild );
	} );

	test( 'should render defaultValue', () => {
		const { container } = render(
			<TextInput defaultValue="WordPress.org" />
		);
		expect( container.firstChild ).toMatchDiffSnapshot( base.firstChild );
	} );

	// TODO: TextareaAutosizeClass is creating invalid attributes.
	test( 'should render multiline', () => {
		const { container } = render( <TextInput isResizable multiline /> );
		expect( container.firstChild ).toMatchDiffSnapshot( base.firstChild );
	} );

	test( 'should render prefix', () => {
		const { container } = render(
			<TextInput prefix={ <span>prefix</span> } />
		);
		expect( container.firstChild ).toMatchDiffSnapshot( base.firstChild );
	} );

	test( 'should render size', () => {
		const { container } = render( <TextInput size="small" /> );
		expect( container.firstChild ).toMatchDiffSnapshot( base.firstChild );
	} );

	test( 'should render suffix', () => {
		const { container } = render(
			<TextInput suffix={ <span>suffix</span> } />
		);
		expect( container.firstChild ).toMatchDiffSnapshot( base.firstChild );
	} );

	test( 'should render value', () => {
		const { container } = render( <TextInput value="WordPress.org" /> );
		expect( container.firstChild ).toMatchDiffSnapshot( base.firstChild );
	} );
} );
