/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { getFontSize, ui } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import Text from '../text';

describe( 'Text', () => {
	describe( 'snapshot tests', () => {
		test( 'should render correctly', () => {
			const { container } = render(
				<Text>Some people are worth melting for.</Text>
			);
			expect( container.firstChild ).toMatchSnapshot();
		} );
	} );

	test( 'should render optimizeReadabilityFor', () => {
		const { container } = render(
			<Text optimizeReadabilityFor="blue">
				Some people are worth melting for.
			</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			color: ui.get( 'white' ),
		} );
	} );

	test( 'should render truncate', () => {
		const { container } = render(
			<Text truncate>Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			textOverflow: 'ellipsis',
		} );
	} );

	test( 'should render size', () => {
		const { container } = render(
			<Text size="title">Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			fontSize: getFontSize( 'title' ),
		} );
	} );

	test( 'should render custom size', () => {
		const { container } = render(
			<Text size={ 15 }>Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			fontSize: getFontSize( 15 ),
		} );
	} );

	test( 'should render variant', () => {
		const { container } = render(
			<Text variant="muted">Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			color: ui.get( 'colorTextMuted' ),
		} );
	} );

	test( 'should render as another element', () => {
		const { container } = render(
			<Text as="div">Some people are worth melting for.</Text>
		);
		expect( container.firstChild.nodeName ).toBe( 'DIV' );
	} );

	test( 'should render align', () => {
		const { container } = render(
			<Text align="center">Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( { textAlign: 'center' } );
	} );

	test( 'should render color', () => {
		const { container } = render(
			<Text color="orange">Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( { color: 'orange' } );
	} );

	test( 'should render display', () => {
		const { container } = render(
			<Text display="inline-flex">
				Some people are worth melting for.
			</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			display: 'inline-flex',
		} );
	} );

	test( 'should render highlighted words', async () => {
		const wrapper = render(
			<Text highlightWords={ [ 'worth' ] }>
				Some people are worth melting for.
			</Text>
		);
		// It should have three child nodes: (Some people are )(worth)( melting for.)
		expect( wrapper.container.firstChild.childNodes ).toHaveLength( 3 );
		const worth = await wrapper.findAllByText( 'worth' );
		expect( worth ).toHaveLength( 1 );
		expect( worth[ 0 ].dataset.g2Component ).toBe( 'TextHighlight' );
	} );

	test( 'should render highlighted words with undefined passed', () => {
		const { container } = render(
			<Text highlightWords={ undefined }>
				Some people are worth melting for.
			</Text>
		);
		// It'll have a length of 1 because there shouldn't be anything but the single span being rendered
		expect( container.firstChild.childNodes ).toHaveLength( 1 );
	} );

	test( 'should render highlighted words with highlightCaseSensitive', () => {
		const { container } = render(
			<Text highlightCaseSensitive highlightWords={ [ 'WORTH' ] }>
				Some people are worth melting for.
			</Text>
		);

		expect( container.firstChild ).toMatchSnapshot();
		// It'll have a length of 1 because there shouldn't be anything but the single span being rendered
		expect( container.firstChild.childNodes ).toHaveLength( 1 );
	} );

	test( 'should render isBlock', () => {
		const { container } = render(
			<Text isBlock>Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			display: 'block',
		} );
	} );

	test( 'should render lineHeight', () => {
		const { container } = render(
			<Text lineHeight={ 1.5 }>Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( { lineHeight: '1.5' } );
	} );

	test( 'should render upperCase', () => {
		const { container } = render(
			<Text upperCase>Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( {
			textTransform: 'uppercase',
		} );
	} );

	test( 'should render weight', () => {
		const { container } = render(
			<Text weight={ 700 }>Some people are worth melting for.</Text>
		);
		expect( container.firstChild ).toHaveStyle( { fontWeight: '700' } );
	} );
} );
