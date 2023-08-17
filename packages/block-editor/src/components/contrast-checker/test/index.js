/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import ContrastChecker from '../';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

describe( 'ContrastChecker', () => {
	const backgroundColor = '#ffffff';
	const textColor = '#000000';
	const linkColor = '#0040ff';
	const isLargeText = true;
	const fallbackBackgroundColor = '#fff';
	const fallbackTextColor = '#000';
	const sameShade = '#666';
	const colorWithTransparency = 'rgba(102,102,102,0.5)'; // #666 with opacity.

	beforeEach( () => {
		speak.mockReset();
	} );

	test( 'should render nothing when no colors are provided', () => {
		const { container } = render( <ContrastChecker /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render nothing when no background or fallback background color is provided', () => {
		const { container } = render(
			<ContrastChecker
				textColor={ textColor }
				linkColor={ linkColor }
				isLargeText={ isLargeText }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render nothing when the colors meet AA WCAG guidelines.', () => {
		const { container } = render(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				textColor={ textColor }
				linkColor={ linkColor }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render component when the text and background colors do not meet AA WCAG guidelines.', () => {
		render(
			<ContrastChecker
				backgroundColor={ sameShade }
				textColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);

		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
			)
		).toBeVisible();
	} );

	test( 'should render component when the link and background colors do not meet AA WCAG guidelines.', () => {
		render(
			<ContrastChecker
				backgroundColor={ sameShade }
				textColor={ textColor }
				linkColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a brighter background color and/or a darker link color.'
			)
		).toBeVisible();
	} );

	test( 'should render component when the link and text and background colors do not meet AA WCAG guidelines.', () => {
		render(
			<ContrastChecker
				backgroundColor={ sameShade }
				textColor={ sameShade }
				linkColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
			)
		).toBeVisible();
	} );

	test( 'should render nothing if background color contains a transparency', () => {
		const { container } = render(
			<ContrastChecker
				backgroundColor={ colorWithTransparency }
				textColor={ sameShade }
				linkColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render nothing if text color contains a transparency', () => {
		const { container } = render(
			<ContrastChecker
				backgroundColor={ sameShade }
				textColor={ colorWithTransparency }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render nothing if link color contains a transparency', () => {
		const { container } = render(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				textColor={ textColor }
				linkColor={ colorWithTransparency }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render different message matching snapshot when background color has less brightness than text color.', () => {
		const darkerShade = '#555';

		render(
			<ContrastChecker
				backgroundColor={ darkerShade }
				textColor={ sameShade }
				isLargeText={ ! isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a darker background color and/or a brighter text color.'
			)
		).toBeVisible();
	} );

	test( 'should take into consideration wherever text is large or not', () => {
		const { container, rerender } = render(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColor="#000000"
				isLargeText={ false }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
			)
		).toBeVisible();

		rerender(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColor="#000000"
				isLargeText={ true }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should take into consideration the font size passed', () => {
		const { container, rerender } = render(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColor="#000000"
				fontSize={ 23 }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
			)
		).toBeVisible();

		rerender(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColor="#000000"
				fontSize={ 24 }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should use isLargeText to make decisions if both isLargeText and fontSize props are passed', () => {
		const { container, rerender } = render(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColor="#000000"
				fontSize={ 23 }
				isLargeText={ true }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();

		rerender(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColor="#000000"
				fontSize={ 24 }
				isLargeText={ false }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
			)
		).toBeVisible();
	} );

	test( 'should render nothing when the colors meet AA WCAG guidelines, with only fallback colors.', () => {
		const { container } = render(
			<ContrastChecker
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render messages when the textColor is valid, but the fallback backgroundColor conflicts.', () => {
		render(
			<ContrastChecker
				textColor={ textColor }
				fallbackBackgroundColor={ textColor }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
			)
		).toBeVisible();
	} );

	test( 'should render messages when the linkColor is valid, but the fallback backgroundColor conflicts.', () => {
		render(
			<ContrastChecker
				linkColor={ linkColor }
				fallbackBackgroundColor={ linkColor }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a brighter background color and/or a darker link color.'
			)
		).toBeVisible();
	} );

	test( 'should re-announce if colors change, but still insufficient contrast', () => {
		const { rerender } = render(
			<ContrastChecker
				textColor={ textColor }
				fallbackBackgroundColor={ textColor }
			/>
		);

		rerender(
			<ContrastChecker
				textColor={ backgroundColor }
				fallbackBackgroundColor={ backgroundColor }
			/>
		);

		expect( speak ).toHaveBeenCalledTimes( 2 );
	} );

	// enableAlphaChecker tests
	test( 'should render nothing when the colors meet AA WCAG guidelines and alpha checker enabled.', () => {
		const { container } = render(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				textColor={ textColor }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render component when the colors meet AA WCAG guidelines but the text color only has alpha transparency with alpha checker enabled.', () => {
		render(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				textColor={ 'rgba(0,0,0,0.9)' }
				linkColor={ linkColor }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent text may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'Transparent text may be hard for people to read.'
			)
		).toBeVisible();
	} );

	test( 'should render component when the colors meet AA WCAG guidelines but the link color only has alpha transparency with alpha checker enabled.', () => {
		render(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				linkColor={ 'rgba(0,0,0,0.9)' }
				textColor={ textColor }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent text may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'Transparent text may be hard for people to read.'
			)
		).toBeVisible();
	} );

	test( 'should render nothing when the colors meet AA WCAG guidelines but the background color only has alpha transparency with alpha checker enabled.', () => {
		const { container } = render(
			<ContrastChecker
				backgroundColor={ 'rgba(255,255,255,0.7)' }
				textColor={ textColor }
				linkColor={ linkColor }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render nothing if background color contains a transparency with alpha checker enabled.', () => {
		const { container } = render(
			<ContrastChecker
				backgroundColor={ colorWithTransparency }
				textColor={ sameShade }
				linkColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
				enableAlphaChecker={ true }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'should render transparency warning only if one text is not readable but the other is transparent and the background color contains a transparency with alpha checker enabled.', () => {
		render(
			<ContrastChecker
				backgroundColor={ colorWithTransparency }
				textColor={ sameShade }
				linkColor={ 'rgba(0,0,0,0.9)' }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
				enableAlphaChecker={ true }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent text may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'Transparent text may be hard for people to read.'
			)
		).toBeVisible();
	} );

	test( 'should render component and prioritize contrast warning when the colors do no meet AA WCAG guidelines and text has alpha transparency with the alpha checker enabled.', () => {
		render(
			<ContrastChecker
				backgroundColor={ sameShade }
				textColor={ 'rgba(0,0,0,0.9)' }
				linkColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
				enableAlphaChecker={ true }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'This color combination may be hard for people to read. Try using a brighter background color and/or a darker link color.'
			)
		).toBeVisible();
	} );

	test( 'should render component when the colors meet AA WCAG guidelines but all colors have alpha transparency with alpha checker enabled.', () => {
		render(
			<ContrastChecker
				backgroundColor={ 'rgba(255,255,255,0.7)' }
				linkColor={ 'rgba(0,0,0,0.7)' }
				textColor={ 'rgba(0,0,0,0.7)' }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent text may be hard for people to read.'
		);
		expect(
			screen.getByText(
				'Transparent text may be hard for people to read.'
			)
		).toBeVisible();
	} );
} );
