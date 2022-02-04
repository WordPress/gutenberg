/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';
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

	test( 'should render null when no colors are provided', () => {
		expect( mount( <ContrastChecker /> ).html() ).toBeNull();
	} );

	test( 'should render null when no background or fallback background color is provided', () => {
		const wrapper = mount(
			<ContrastChecker
				textColors={ [
					{
						color: textColor,
						fallback: undefined,
						description: 'text color',
					},
					{
						color: linkColor,
						fallback: undefined,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render null when the colors meet AA WCAG guidelines.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				textColors={ [
					{
						color: textColor,
						fallback: fallbackTextColor,
						description: 'text color',
					},
					{
						color: linkColor,
						fallback: undefined,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render component when the text and background colors do not meet AA WCAG guidelines.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				textColors={ [
					{
						color: sameShade,
						fallback: fallbackTextColor,
						description: 'text color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
		);
	} );

	test( 'should render component when the link and background colors do not meet AA WCAG guidelines.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				textColors={ [
					{
						color: textColor,
						fallback: fallbackTextColor,
						description: 'text color',
					},
					{
						color: sameShade,
						fallback: undefined,
						description: 'link color, Jack',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker link color, Jack.'
		);
	} );

	test( 'should render component when the link and text and background colors do not meet AA WCAG guidelines.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				textColors={ [
					{
						color: sameShade,
						fallback: fallbackTextColor,
						description: 'text color',
					},
					{
						color: sameShade,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
		);
	} );

	test( 'should render render null if background color contains a transparency', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ colorWithTransparency }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				textColors={ [
					{
						color: sameShade,
						description: 'text color',
					},
					{
						color: sameShade,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render null if text color contains a transparency', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				textColors={ [
					{
						color: colorWithTransparency,
						description: 'text color',
					},
				] }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render render null if link color contains a transparency', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				textColors={ [
					{
						color: textColor,
						description: 'text color',
					},
					{
						color: colorWithTransparency,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render different message matching snapshot when background color has less brightness than text color.', () => {
		const darkerShade = '#555';

		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ darkerShade }
				isLargeText={ ! isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				textColors={ [
					{
						color: sameShade,
						fallback: fallbackTextColor,
						description: 'text color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a darker background color and/or a brighter text color.'
		);
	} );

	test( 'should take into consideration wherever text is large or not', () => {
		const wrapperSmallText = mount(
			<ContrastChecker
				backgroundColor="#C44B4B"
				isLargeText={ false }
				textColors={ [
					{
						color: '#000000',
						description: 'text color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapperSmallText.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
		);

		const wrapperLargeText = mount(
			<ContrastChecker
				backgroundColor="#C44B4B"
				isLargeText={ true }
				textColors={ [
					{
						color: '#000000',
						description: 'text color',
					},
				] }
			/>
		);

		expect( wrapperLargeText.html() ).toBeNull();
	} );

	test( 'should take into consideration the font size passed', () => {
		const wrapperSmallFontSize = mount(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColors={ [
					{
						color: '#000000',
						description: 'text color',
					},
				] }
				fontSize={ 23 }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapperSmallFontSize.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
		);

		const wrapperLargeText = mount(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColors={ [
					{
						color: '#000000',
						description: 'text color',
					},
				] }
				fontSize={ 24 }
			/>
		);

		expect( wrapperLargeText.html() ).toBeNull();
	} );

	test( 'should use isLargeText to make decisions if both isLargeText and fontSize props are passed', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColors={ [
					{
						color: '#000000',
						description: 'text color',
					},
				] }
				fontSize={ 23 }
				isLargeText={ true }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();

		const wrapperNoLargeText = mount(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColors={ [
					{
						color: '#000000',
						description: 'text color',
					},
				] }
				fontSize={ 24 }
				isLargeText={ false }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapperNoLargeText.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
		);
	} );

	test( 'should render null when the colors meet AA WCAG guidelines, with only fallback colors.', () => {
		const wrapper = mount(
			<ContrastChecker
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				textColors={ [
					{
						fallback: fallbackTextColor,
						description: 'text color',
					},
				] }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render messages when the textColor is valid, but the fallback backgroundColor conflicts.', () => {
		const wrapper = mount(
			<ContrastChecker
				fallbackBackgroundColor={ textColor }
				textColors={ [
					{
						color: textColor,
						description: 'text color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
		);
	} );

	test( 'should render messages when the linkColor is valid, but the fallback backgroundColor conflicts.', () => {
		const wrapper = mount(
			<ContrastChecker
				fallbackBackgroundColor={ linkColor }
				textColors={ [
					{
						color: linkColor,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker link color.'
		);
	} );

	test( 'should re-announce if colors change, but still insufficient contrast', () => {
		const appRoot = document.createElement( 'div' );

		act( () => {
			render(
				<ContrastChecker
					fallbackBackgroundColor={ textColor }
					textColors={ [
						{
							color: textColor,
							description: 'text color',
						},
					] }
				/>,
				appRoot
			);
		} );

		act( () => {
			render(
				<ContrastChecker
					textColors={ [
						{
							color: backgroundColor,
							description: 'text color',
						},
					] }
					fallbackBackgroundColor={ backgroundColor }
				/>,
				appRoot
			);
		} );

		expect( speak ).toHaveBeenCalledTimes( 2 );
	} );

	// enableAlphaChecker tests
	test( 'should render null when the colors meet AA WCAG guidelines and alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
				textColors={ [
					{
						color: textColor,
						description: 'text color',
					},
				] }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render component when the colors meet AA WCAG guidelines but the text color only has alpha transparency with alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
				textColors={ [
					{
						color: 'rgba(0,0,0,0.9)',
						description: 'text color',
					},
					{
						color: linkColor,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent text may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'Transparent text may be hard for people to read.'
		);
	} );

	test( 'should render component when the colors meet AA WCAG guidelines but the link color only has alpha transparency with alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
				textColors={ [
					{
						color: textColor,
						description: 'text color',
					},
					{
						color: 'rgba(0,0,0,0.9)',
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent text may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'Transparent text may be hard for people to read.'
		);
	} );

	test( 'should render null when the colors meet AA WCAG guidelines but the background color only has alpha transparency with alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ 'rgba(255,255,255,0.7)' }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
				textColors={ [
					{
						color: textColor,
						description: 'text color',
					},
					{
						color: linkColor,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render null if background color contains a transparency with alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ colorWithTransparency }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				enableAlphaChecker={ true }
				textColors={ [
					{
						color: sameShade,
						fallback: fallbackTextColor,
						description: 'text color',
					},
					{
						color: sameShade,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render transparency warning only if one text is not readable but the other is transparent and the background color contains a transparency with alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ colorWithTransparency }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				enableAlphaChecker={ true }
				textColors={ [
					{
						color: sameShade,
						fallback: fallbackTextColor,
						description: 'text color',
					},
					{
						color: 'rgba(0,0,0,0.9)',
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent text may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'Transparent text may be hard for people to read.'
		);
	} );

	test( 'should render component and prioritize contrast warning when the colors do no meet AA WCAG guidelines and text has alpha transparency with the alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				enableAlphaChecker={ true }
				textColors={ [
					{
						color: 'rgba(0,0,0,0.9)',
						description: 'text color',
					},
					{
						color: sameShade,
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker link color.'
		);
	} );

	test( 'should render component when the colors meet AA WCAG guidelines but all colors have alpha transparency with alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ 'rgba(255,255,255,0.7)' }
				isLargeText={ isLargeText }
				enableAlphaChecker={ true }
				textColors={ [
					{
						color: 'rgba(0,0,0,0.7)',
						description: 'text color',
					},
					{
						color: 'rgba(0,0,0,0.7)',
						description: 'link color',
					},
				] }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent text may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'Transparent text may be hard for people to read.'
		);
	} );
} );
