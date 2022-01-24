/**
 * External dependencies
 */
import { filter, map } from 'lodash';
import TestUtils, { act } from 'react-dom/test-utils';
import ReactDOM from 'react-dom';

/**
 * Internal dependencies
 */
import fixtures from './lib/fixtures';
import TokenFieldWrapper from './lib/token-field-wrapper';
import TokenInput from '../token-input';

/**
 * Module variables
 */
const keyCodes = {
	backspace: 8,
	tab: 9,
	enter: 13,
	leftArrow: 37,
	upArrow: 38,
	rightArrow: 39,
	downArrow: 40,
	delete: 46,
	comma: 188,
};

const charCodes = {
	comma: 44,
};

describe( 'FormTokenField', () => {
	let wrapper, wrapperElement, textInputElement, textInputComponent;

	function setText( text ) {
		TestUtils.Simulate.change( textInputElement(), {
			target: {
				value: text,
			},
		} );
	}

	function sendKeyDown( keyCode, shiftKey ) {
		TestUtils.Simulate.keyDown( wrapperElement(), {
			keyCode,
			shiftKey: !! shiftKey,
		} );
	}

	function sendKeyPress( charCode ) {
		TestUtils.Simulate.keyPress( wrapperElement(), { charCode } );
	}

	function getTokensHTML() {
		const textNodes = wrapperElement().querySelectorAll(
			'.components-form-token-field__token-text span[aria-hidden]'
		);
		return map( textNodes, ( node ) => node.innerHTML );
	}

	function getSuggestionsText( selector ) {
		const suggestionNodes = wrapperElement().querySelectorAll(
			selector || '.components-form-token-field__suggestion'
		);

		return map( suggestionNodes, getSuggestionNodeText );
	}

	function getSuggestionNodeText( node ) {
		if ( ! node.querySelector( 'span' ) ) {
			return node.outerHTML;
		}

		// This suggestion is part of a partial match; return up to three
		// sections of the suggestion (before match, match, and after
		// match)
		const div = document.createElement( 'div' );
		div.innerHTML = node.querySelector( 'span' ).outerHTML;
		return map(
			filter(
				div.firstChild.childNodes,
				( childNode ) => childNode.nodeType !== childNode.COMMENT_NODE
			),
			( childNode ) => childNode.textContent
		);
	}

	function getSelectedSuggestion() {
		const selectedSuggestions = getSuggestionsText(
			'.components-form-token-field__suggestion.is-selected'
		);

		return selectedSuggestions[ 0 ] || null;
	}

	function setUp( props ) {
		wrapper = TestUtils.renderIntoDocument(
			<TokenFieldWrapper { ...props } />
		);
		/* eslint-disable react/no-find-dom-node */
		wrapperElement = () => ReactDOM.findDOMNode( wrapper );
		textInputElement = () =>
			TestUtils.findRenderedDOMComponentWithClass(
				wrapper,
				'components-form-token-field__input'
			);
		textInputComponent = () =>
			TestUtils.findRenderedComponentWithType( wrapper, TokenInput );
		/* eslint-enable react/no-find-dom-node */
		TestUtils.Simulate.focus( textInputElement() );
	}

	describe( 'displaying tokens', () => {
		it( 'should render default tokens', () => {
			setUp();
			wrapper.setState( {
				isExpanded: true,
			} );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should display tokens with escaped special characters properly', () => {
			setUp();
			wrapper.setState( {
				tokens: fixtures.specialTokens.textEscaped,
				isExpanded: true,
			} );
			expect( getTokensHTML() ).toEqual(
				fixtures.specialTokens.htmlEscaped
			);
		} );

		it( 'should display tokens with special characters properly', () => {
			setUp();
			// This test is not as realistic as the previous one: if a WP site
			// contains tag names with special characters, the API will always
			// return the tag names already escaped.  However, this is still
			// worth testing, so we can be sure that token values with
			// dangerous characters in them don't have these characters carried
			// through unescaped to the HTML.
			wrapper.setState( {
				tokens: fixtures.specialTokens.textUnescaped,
				isExpanded: true,
			} );
			expect( getTokensHTML() ).toEqual(
				fixtures.specialTokens.htmlUnescaped
			);
		} );
	} );

	describe( 'suggestions', () => {
		it( 'should not render suggestions unless we type at least two characters', () => {
			setUp();
			wrapper.setState( {
				isExpanded: true,
			} );
			expect( getSuggestionsText() ).toEqual( [] );
			setText( 'th' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.th
			);
		} );

		it( 'should show suggestions when when input is empty if expandOnFocus is set to true', () => {
			setUp( { __experimentalExpandOnFocus: true } );
			wrapper.setState( {
				isExpanded: true,
			} );
			expect( getSuggestionsText() ).not.toEqual( [] );
		} );

		it( 'should remove already added tags from suggestions', () => {
			setUp();
			wrapper.setState( {
				tokens: Object.freeze( [ 'of', 'and' ] ),
			} );
			expect( getSuggestionsText() ).not.toEqual( getTokensHTML() );
		} );

		it( 'suggestions that begin with match are boosted', () => {
			setUp();
			wrapper.setState( {
				isExpanded: true,
			} );
			setText( 'so' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.so
			);
		} );

		it( 'should match against the unescaped values of suggestions with special characters', () => {
			setUp();
			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
				isExpanded: true,
			} );
			setText( '& S' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.specialSuggestions.matchAmpersandUnescaped
			);
		} );

		it( 'should match against the unescaped values of suggestions with special characters (including spaces)', () => {
			setUp();
			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
				isExpanded: true,
			} );
			setText( 's &' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.specialSuggestions.matchAmpersandSequence
			);
		} );

		it( 'should not match against the escaped values of suggestions with special characters', () => {
			setUp();
			setText( 'amp' );
			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
				isExpanded: true,
			} );
			expect( getSuggestionsText() ).toEqual(
				fixtures.specialSuggestions.matchAmpersandEscaped
			);
		} );

		it( 'should match suggestions even with trailing spaces', () => {
			setUp();
			wrapper.setState( {
				isExpanded: true,
			} );
			setText( '  at  ' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.at
			);
		} );

		it( 'should manage the selected suggestion based on both keyboard and mouse events', () => {
			setUp();
			wrapper.setState( {
				isExpanded: true,
			} );
			setText( 'th' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.th
			);
			expect( getSelectedSuggestion() ).toBe( null );
			sendKeyDown( keyCodes.downArrow ); // 'the'
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'e' ] );
			sendKeyDown( keyCodes.downArrow ); // 'that'
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'at' ] );

			const hoverSuggestion = wrapperElement().querySelectorAll(
				'.components-form-token-field__suggestion'
			)[ 3 ]; // 'with'
			expect( getSuggestionNodeText( hoverSuggestion ) ).toEqual( [
				'wi',
				'th',
			] );

			// before sending a hover event, we need to wait for
			// SuggestionList#_scrollingIntoView to become false
			act( () => {
				jest.advanceTimersByTime( 100 );
			} );

			TestUtils.Simulate.mouseEnter( hoverSuggestion );
			expect( getSelectedSuggestion() ).toEqual( [ 'wi', 'th' ] );
			sendKeyDown( keyCodes.upArrow );
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'is' ] );
			sendKeyDown( keyCodes.upArrow );
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'at' ] );
			TestUtils.Simulate.click( hoverSuggestion );
			expect( getSelectedSuggestion() ).toBe( null );
			expect( getTokensHTML() ).toEqual( [ 'foo', 'bar', 'with' ] );
		} );

		it( 'should re-render when suggestions prop has changed', () => {
			setUp();
			wrapper.setState( {
				tokenSuggestions: [],
				isExpanded: true,
			} );
			expect( getSuggestionsText() ).toEqual( [] );
			setText( 'so' );
			expect( getSuggestionsText() ).toEqual( [] );

			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.default,
			} );
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.so
			);

			wrapper.setState( {
				tokenSuggestions: [],
			} );
			expect( getSuggestionsText() ).toEqual( [] );
		} );
	} );

	describe( 'adding tokens', () => {
		it( 'should not allow adding blank tokens with Tab', () => {
			setUp();
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should not allow adding whitespace tokens with Tab', () => {
			setUp();
			setText( '   ' );
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should add a token when Enter pressed', () => {
			setUp();
			setText( 'baz' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar', 'baz' ] );
			const textNode = textInputComponent();
			expect( textNode.props.value ).toBe( '' );
		} );

		it( 'should not allow adding blank tokens with Enter', () => {
			setUp();
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should not allow adding whitespace tokens with Enter', () => {
			setUp();
			setText( '   ' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should not allow adding whitespace tokens with comma', () => {
			setUp();
			setText( '   ' );
			sendKeyPress( charCodes.comma );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should add a token when comma pressed', () => {
			setUp();
			setText( 'baz' );
			sendKeyPress( charCodes.comma );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar', 'baz' ] );
		} );

		it( 'should trim token values when adding', () => {
			setUp();
			setText( '  baz  ' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar', 'baz' ] );
		} );

		it( "should not add values that don't pass the validation", () => {
			setUp( {
				__experimentalValidateInput: ( newValue ) => newValue !== 'baz',
			} );
			setText( 'baz' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state.tokens ).toEqual( [ 'foo', 'bar' ] );
		} );
	} );

	describe( 'removing tokens', () => {
		it( 'should remove tokens when X icon clicked', () => {
			setUp();
			const forClickNode = wrapperElement().querySelector(
				'.components-form-token-field__remove-token'
			).firstChild;
			TestUtils.Simulate.click( forClickNode );
			expect( wrapper.state.tokens ).toEqual( [ 'bar' ] );
		} );
	} );
} );
