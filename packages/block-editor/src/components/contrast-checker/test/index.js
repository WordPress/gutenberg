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
	const isLargeText = true;
	const fallbackBackgroundColor = '#fff';
	const fallbackTextColor = '#000';
	const sameShade = '#666';
	const colorWithTransparency = 'rgba(102,102,102,0.5)';

	beforeEach( () => {
		speak.mockReset();
	} );

	test( 'should render null when no colors are provided', () => {
		expect( mount( <ContrastChecker /> ).html() ).toBeNull();
	} );

	test( 'should render null when the colors meet AA WCAG guidelines.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				textColor={ textColor }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render null when the colors meet AA WCAG guidelines and alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ backgroundColor }
				textColor={ textColor }
				isLargeText={ isLargeText }
				__experimentalEnableAlphaChecker={ true }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render component when the colors do not meet AA WCAG guidelines.', () => {
		const wrapper = mount(
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
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
		);
	} );

	test( 'should render render null if background color contains a transparency', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ colorWithTransparency }
				textColor={ sameShade }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render render null if text color contains a transparency', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ sameShade }
				textColor={ colorWithTransparency }
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
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
				textColor={ sameShade }
				isLargeText={ ! isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
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
				textColor="#000000"
				isLargeText={ false }
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
				textColor="#000000"
				isLargeText={ true }
			/>
		);

		expect( wrapperLargeText.html() ).toBeNull();
	} );

	test( 'should take into consideration the font size passed', () => {
		const wrapperSmallFontSize = mount(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColor="#000000"
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
				textColor="#000000"
				fontSize={ 24 }
			/>
		);

		expect( wrapperLargeText.html() ).toBeNull();
	} );

	test( 'should use isLargeText to make decisions if both isLargeText and fontSize props are passed', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor="#C44B4B"
				textColor="#000000"
				fontSize={ 23 }
				isLargeText={ true }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();

		const wrapperNoLargeText = mount(
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
		expect( wrapperNoLargeText.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
		);
	} );

	test( 'should render null when the colors meet AA WCAG guidelines, with only fallback colors.', () => {
		const wrapper = mount(
			<ContrastChecker
				isLargeText={ isLargeText }
				fallbackBackgroundColor={ fallbackBackgroundColor }
				fallbackTextColor={ fallbackTextColor }
			/>
		);

		expect( speak ).not.toHaveBeenCalled();
		expect( wrapper.html() ).toBeNull();
	} );

	test( 'should render messages when the textColor is valid, but the fallback backgroundColor conflicts.', () => {
		const wrapper = mount(
			<ContrastChecker
				textColor={ textColor }
				fallbackBackgroundColor={ textColor }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'This color combination may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
		);
	} );

	test( 'should re-announce if colors change, but still insufficient contrast', () => {
		const appRoot = document.createElement( 'div' );

		act( () => {
			render(
				<ContrastChecker
					textColor={ textColor }
					fallbackBackgroundColor={ textColor }
				/>,
				appRoot
			);
		} );

		act( () => {
			render(
				<ContrastChecker
					textColor={ backgroundColor }
					fallbackBackgroundColor={ backgroundColor }
				/>,
				appRoot
			);
		} );

		expect( speak ).toHaveBeenCalledTimes( 2 );
	} );

	// __experimentalEnableAlphaChecker tests
	test( 'should render component when the colors meet AA WCAG guidelines but the text color has alpha transparency with alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ 'rgba(255,255,255,0.7)' }
				textColor={ textColor }
				isLargeText={ isLargeText }
				__experimentalEnableAlphaChecker={ true }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent colors may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'Transparent background and/or text colors may be hard for people to read.'
		);
	} );

	test( 'should render component when the colors meet AA WCAG guidelines but the background color has alpha transparency with alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ 'rgba(255,255,255,0.7)' }
				textColor={ textColor }
				isLargeText={ isLargeText }
				__experimentalEnableAlphaChecker={ true }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent colors may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'Transparent background and/or text colors may be hard for people to read.'
		);
	} );

	test( 'should render component when the colors meet AA WCAG guidelines but all colors have alpha transparency with alpha checker enabled.', () => {
		const wrapper = mount(
			<ContrastChecker
				backgroundColor={ 'rgba(255,255,255,0.7)' }
				textColor={ 'rgba(0,0,0,0.7)' }
				isLargeText={ isLargeText }
				__experimentalEnableAlphaChecker={ true }
			/>
		);

		expect( speak ).toHaveBeenCalledWith(
			'Transparent colors may be hard for people to read.'
		);
		expect( wrapper.find( Notice ).children().text() ).toBe(
			'Transparent background and/or text colors may be hard for people to read.'
		);
	} );
} );
