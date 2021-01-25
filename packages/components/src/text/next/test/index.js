/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Text } from '../text';

describe( 'Text', () => {
	describe( 'snapshot tests', () => {
		/**
		 * We cannot make these assertions programatically for one of a few reasons, varying depending on the situation:
		 * 1. The result is too complicated and we would create an even more fragile test than a snapshot
		 * 2. A programatic test would depend too heavily on the internals of the component, thereby testing the implementation rather than the result
		 * 3. The variable being tested does not resolve in `getComputedStyle` because it is a `var( --wp-g2-color-name )` style variable for which the computed style will be empty (because the theme is not applied in the test environment so the variable does not exist)
		 *
		 * I've noted for each test which reason I think applies for each.
		 */

		// Reason 1
		test( 'should render correctly', () => {
			const { container } = render(
				<Text>Some people are worth melting for.</Text>
			);
			expect( container.firstChild ).toMatchSnapshot();
		} );

		// Reason 2
		test( 'should render optimizeReadabilityFor', () => {
			const { container } = render(
				<Text optimizeReadabilityFor="blue">
					Some people are worth melting for.
				</Text>
			);
			expect( container.firstChild ).toMatchSnapshot();
		} );

		// Reason 3
		test( 'should render size', () => {
			const { container } = render(
				<Text size="title">Some people are worth melting for.</Text>
			);
			expect( container.firstChild ).toMatchSnapshot();
		} );

		// Reason 3
		test( 'should render custom size', () => {
			const { container } = render(
				<Text size={ 15 }>Some people are worth melting for.</Text>
			);
			expect( container.firstChild ).toMatchSnapshot();
		} );

		// Reason 3
		test( 'should render truncate', () => {
			const { container } = render(
				<Text truncate>Some people are worth melting for.</Text>
			);
			expect( container.firstChild ).toMatchSnapshot();
		} );

		// Reason 3
		test( 'should render variant', () => {
			const { container } = render(
				<Text variant="muted">Some people are worth melting for.</Text>
			);
			expect(
				window.getComputedStyle( container.firstChild )
			).toMatchSnapshot();
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
		expect(
			window.getComputedStyle( container.firstChild ).textAlign
		).toBe( 'center' );
	} );

	test( 'should render color', () => {
		const { container } = render(
			<Text color="orange">Some people are worth melting for.</Text>
		);
		expect( window.getComputedStyle( container.firstChild ).color ).toBe(
			'orange'
		);
	} );

	test( 'should render display', () => {
		const { container } = render(
			<Text display="inline-flex">
				Some people are worth melting for.
			</Text>
		);
		expect( window.getComputedStyle( container.firstChild ).display ).toBe(
			'inline-flex'
		);
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
		expect( window.getComputedStyle( container.firstChild ).display ).toBe(
			'block'
		);
	} );

	test( 'should render lineHeight', () => {
		const { container } = render(
			<Text lineHeight={ 1.5 }>Some people are worth melting for.</Text>
		);
		expect(
			window.getComputedStyle( container.firstChild ).lineHeight
		).toBe( '1.5' );
	} );

	test( 'should render upperCase', () => {
		const { container } = render(
			<Text upperCase>Some people are worth melting for.</Text>
		);
		expect(
			window.getComputedStyle( container.firstChild ).textTransform
		).toBe( 'uppercase' );
	} );

	test( 'should render weight', () => {
		const { container } = render(
			<Text weight={ 700 }>Some people are worth melting for.</Text>
		);
		expect(
			window.getComputedStyle( container.firstChild ).fontWeight
		).toBe( '700' );
	} );
} );
