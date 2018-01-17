/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ContrastChecker from '../';

describe( 'ContrastChecker', () => {
	const backgroundColor = '#ffffff';
	const textColor = '#000000';
	const isLargeText = true;
	const fallbackBackgroundColor = '#fff';
	const fallbackTextColor = '#000';
	const sameShade = '#666';

	const wrapper = shallow(
		<ContrastChecker
			backgroundColor={ backgroundColor }
			textColor={ textColor }
			isLargeText={ isLargeText }
			fallbackBackgroundColor={ fallbackBackgroundColor }
			fallbackTextColor={ fallbackTextColor } />
	);

	test( 'should render null when no colors are provided', () => {
		expect( shallow( <ContrastChecker /> ).html() ).toBeNull();
	} );

	test( 'should render null when the colors meet AA WCAG guidelines.', () => {
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render component when the colors do not meet AA WCAG guidelines.', () => {
		const componentWrapper = shallow(
			<ContrastChecker
				backgroundColor={ sameShade }
				textColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor } />
		);

		expect( componentWrapper ).toMatchSnapshot();
	} );

	test( 'should render different message matching snapshot when background color has less brightness than text color.', () => {
		const darkerShade = '#555';

		const componentWrapper = shallow(
			<ContrastChecker
				backgroundColor={ darkerShade }
				textColor={ sameShade }
				isLargeText={ ! isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor } />
		);

		expect( componentWrapper ).toMatchSnapshot();
	} );

	test( 'should render null when the colors meet AA WCAG guidelines, with only fallback colors.', () => {
		const componentWrapper = shallow(
			<ContrastChecker
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor } />
		);

		expect( componentWrapper.html() ).toBeNull();
	} );

	test( 'should render messages when the textColor is valid, but the fallback backgroundColor conflicts.', () => {
		const componentWrapper = shallow(
			<ContrastChecker
				textColor={ textColor }
				fallbackBackgroundColor={ textColor } />
		);

		expect( componentWrapper ).toMatchSnapshot();
	} );
} );
