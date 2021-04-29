/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { getFontSize } from '../../utils/font-size';
import { COLORS } from '../../../utils/colors-values';
import { Text } from '..';

describe( 'Text', () => {
	describe( 'snapshot tests', () => {
		test( 'should render correctly', () => {
			const { container } = render( <Text>Lorem ipsum.</Text> );
			expect( container.firstChild ).toMatchSnapshot();
		} );
	} );

	test( 'should render optimizeReadabilityFor', () => {
		const { container } = render(
			<Text optimizeReadabilityFor="blue">Lorem ipsum.</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			color: COLORS.white,
		} );
	} );

	test( 'should render truncate', () => {
		const { container } = render( <Text truncate>Lorem ipsum.</Text> );
		expect( container.firstChild ).toHaveStyle( {
			textOverflow: 'ellipsis',
		} );
	} );

	test( 'should render size', () => {
		const { container } = render( <Text size="title">Lorem ipsum.</Text> );
		expect( container.firstChild ).toHaveStyle( {
			fontSize: getFontSize( 'title' ),
		} );
	} );

	test( 'should render custom size', () => {
		const { container } = render( <Text size={ 15 }>Lorem ipsum.</Text> );
		expect( container.firstChild ).toHaveStyle( {
			fontSize: getFontSize( 15 ),
		} );
	} );

	test( 'should render variant', () => {
		const { container } = render(
			<Text variant="muted">Lorem ipsum.</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			color: COLORS.mediumGray.text,
		} );
	} );

	test( 'should render as another element', () => {
		const { container } = render( <Text as="div">Lorem ipsum.</Text> );
		expect( container.firstChild.nodeName ).toBe( 'DIV' );
	} );

	test( 'should render align', () => {
		const { container } = render(
			<Text align="center">Lorem ipsum.</Text>
		);
		expect( container.firstChild ).toHaveStyle( { textAlign: 'center' } );
	} );

	test( 'should render color', () => {
		const { container } = render(
			<Text color="orange">Lorem ipsum.</Text>
		);
		expect( container.firstChild ).toHaveStyle( { color: 'orange' } );
	} );

	test( 'should render display', () => {
		const { container } = render(
			<Text display="inline-flex">Lorem ipsum.</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			display: 'inline-flex',
		} );
	} );

	test( 'should render highlighted words', async () => {
		const wrapper = render(
			<Text highlightWords={ [ 'm' ] }>Lorem ipsum.</Text>
		);
		expect( wrapper.container.firstChild.childNodes ).toHaveLength( 5 );
		const words = await wrapper.findAllByText( 'm' );
		expect( words ).toHaveLength( 2 );
		words.forEach( ( word ) => expect( word.tagName ).toEqual( 'MARK' ) );
	} );

	test( 'should render highlighted words with undefined passed', () => {
		const { container } = render(
			<Text highlightWords={ undefined }>Lorem ipsum.</Text>
		);
		// It'll have a length of 1 because there shouldn't be anything but the single span being rendered
		expect( container.firstChild.childNodes ).toHaveLength( 1 );
	} );

	test( 'should render highlighted words with highlightCaseSensitive', () => {
		const { container } = render(
			<Text highlightCaseSensitive highlightWords={ [ 'IPSUM' ] }>
				Lorem ipsum.
			</Text>
		);

		expect( container.firstChild ).toMatchSnapshot();
		// It'll have a length of 1 because there shouldn't be anything but the single span being rendered
		expect( container.firstChild.childNodes ).toHaveLength( 1 );
	} );

	test( 'should render isBlock', () => {
		const { container } = render( <Text isBlock>Lorem ipsum.</Text> );
		expect( container.firstChild ).toHaveStyle( {
			display: 'block',
		} );
	} );

	test( 'should render lineHeight', () => {
		const { container } = render(
			<Text lineHeight={ 1.5 }>Lorem ipsum.</Text>
		);
		expect( container.firstChild ).toHaveStyle( { lineHeight: '1.5' } );
	} );

	test( 'should render upperCase', () => {
		const { container } = render( <Text upperCase>Lorem ipsum.</Text> );
		expect( container.firstChild ).toHaveStyle( {
			textTransform: 'uppercase',
		} );
	} );

	test( 'should render weight', () => {
		const { container } = render(
			<Text weight={ 700 }>Lorem ipsum.</Text>
		);
		expect( container.firstChild ).toHaveStyle( { fontWeight: '700' } );
	} );
} );
