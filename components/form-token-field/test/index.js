/**
 * External dependencies
 */
import { filter, map } from 'lodash';
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import fixtures from './lib/fixtures';
import TokenFieldWrapper from './lib/token-field-wrapper';

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

const maybeDescribe = process.env.RUN_SLOW_TESTS ? describe : describe.skip;

maybeDescribe( 'FormTokenField', function() {
	let wrapper, textInputNode;

	function setText( text ) {
		textInputNode.simulate( 'change', { target: { value: text } } );
	}

	function sendKeyDown( keyCode, shiftKey ) {
		wrapper.simulate( 'keyDown', {
			keyCode: keyCode,
			shiftKey: ! ! shiftKey,
		} );
	}

	function sendKeyPress( charCode ) {
		wrapper.simulate( 'keyPress', {
			charCode: charCode,
		} );
	}

	function getNodeInnerHtml( node ) {
		const div = document.createElement( 'div' );
		div.innerHTML = node.html();
		return div.firstChild.innerHTML;
	}

	function getTokensHTML() {
		const textNodes = wrapper.find( '.components-form-token-field__token-text' );

		return textNodes.map( getNodeInnerHtml );
	}

	function getSuggestionsText( selector ) {
		const suggestionNodes = wrapper.find( selector || '.components-form-token-field__suggestion' );

		return suggestionNodes.map( getSuggestionNodeText );
	}

	function getSuggestionNodeText( node ) {
		if ( ! node.find( 'span' ).length ) {
			return getNodeInnerHtml( node );
		}

		// This suggestion is part of a partial match; return up to three
		// sections of the suggestion (before match, match, and after
		// match)
		const div = document.createElement( 'div' );
		div.innerHTML = node.find( 'span' ).html();

		return map(
			filter(
				div.firstChild.childNodes,
				childNode => childNode.nodeType !== window.Node.COMMENT_NODE
			),
			childNode => childNode.textContent
		);
	}

	function getSelectedSuggestion() {
		const selectedSuggestions = getSuggestionsText( '.components-form-token-field__suggestion.is-selected' );

		return selectedSuggestions[ 0 ] || null;
	}

	beforeEach( function() {
		wrapper = mount( <TokenFieldWrapper /> );
		textInputNode = wrapper.find( '.components-form-token-field__input' );
		textInputNode.simulate( 'focus' );
	} );

	describe( 'displaying tokens', function() {
		it( 'should render default tokens', function() {
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should display tokens with escaped special characters properly', function() {
			wrapper.setState( {
				tokens: fixtures.specialTokens.textEscaped,
			} );
			expect( getTokensHTML() ).toEqual( fixtures.specialTokens.htmlEscaped );
		} );

		it( 'should display tokens with special characters properly', function() {
			// This test is not as realistic as the previous one: if a WP site
			// contains tag names with special characters, the API will always
			// return the tag names already escaped.  However, this is still
			// worth testing, so we can be sure that token values with
			// dangerous characters in them don't have these characters carried
			// through unescaped to the HTML.
			wrapper.setState( {
				tokens: fixtures.specialTokens.textUnescaped,
			} );
			expect( getTokensHTML() ).toEqual( fixtures.specialTokens.htmlUnescaped );
		} );
	} );

	describe( 'suggestions', function() {
		it( 'should not render suggestions unless we type at least two characters', function() {
			expect( getSuggestionsText() ).toEqual( [] );
			setText( 'th' );
			expect( getSuggestionsText() ).toEqual( fixtures.matchingSuggestions.th );
		} );

		it( 'should remove already added tags from suggestions', function() {
			wrapper.setState( {
				tokens: Object.freeze( [ 'of', 'and' ] ),
			} );
			expect( getSuggestionsText() ).not.toEqual( getTokensHTML() );
		} );

		it( 'suggestions that begin with match are boosted', function() {
			setText( 'so' );
			expect( getSuggestionsText() ).toEqual( fixtures.matchingSuggestions.so );
		} );

		it( 'should match against the unescaped values of suggestions with special characters', function() {
			setText( '& S' );
			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
			} );
			expect( getSuggestionsText() ).toEqual( fixtures.specialSuggestions.matchAmpersandUnescaped );
		} );

		it( 'should match against the unescaped values of suggestions with special characters (including spaces)', function() {
			setText( 's &' );
			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
			} );
			expect( getSuggestionsText() ).toEqual( fixtures.specialSuggestions.matchAmpersandSequence );
		} );

		it( 'should not match against the escaped values of suggestions with special characters', function() {
			setText( 'amp' );
			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
			} );
			expect( getSuggestionsText() ).toEqual( fixtures.specialSuggestions.matchAmpersandEscaped );
		} );

		it( 'should match suggestions even with trailing spaces', function() {
			setText( '  at  ' );
			expect( getSuggestionsText() ).toEqual( fixtures.matchingSuggestions.at );
		} );

		it( 'should manage the selected suggestion based on both keyboard and mouse events', function() {
			setText( 'th' );
			expect( getSuggestionsText() ).toEqual( fixtures.matchingSuggestions.th );
			expect( getSelectedSuggestion() ).toBe( null );
			sendKeyDown( keyCodes.downArrow ); // 'the'
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'e' ] );
			sendKeyDown( keyCodes.downArrow ); // 'that'
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'at' ] );

			const hoverSuggestion = wrapper.find( '.components-form-token-field__suggestion' ).at( 3 ); // 'with'
			expect( getSuggestionNodeText( hoverSuggestion ) ).toEqual( [ 'wi', 'th' ] );

			// before sending a hover event, we need to wait for
			// SuggestionList#_scrollingIntoView to become false
			jest.runTimersToTime( 100 );

			hoverSuggestion.simulate( 'mouseEnter' );
			expect( getSelectedSuggestion() ).toEqual( [ 'wi', 'th' ] );
			sendKeyDown( keyCodes.upArrow );
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'is' ] );
			sendKeyDown( keyCodes.upArrow );
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'at' ] );
			hoverSuggestion.simulate( 'click' );
			expect( getSelectedSuggestion() ).toBe( null );
			expect( getTokensHTML() ).toEqual( [ 'foo', 'bar', 'with' ] );
		} );
	} );

	describe( 'adding tokens', function() {
		it( 'should add a token when Tab pressed', function() {
			setText( 'baz' );
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz' ] );
			expect( textInputNode.prop( 'value' ) ).toBe( '' );
		} );

		it( 'should not allow adding blank tokens with Tab', function() {
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should not allow adding whitespace tokens with Tab', function() {
			setText( '   ' );
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should add a token when Enter pressed', function() {
			setText( 'baz' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz' ] );
			expect( textInputNode.prop( 'value' ) ).toBe( '' );
		} );

		it( 'should not allow adding blank tokens with Enter', function() {
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should not allow adding whitespace tokens with Enter', function() {
			setText( '   ' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should not allow adding whitespace tokens with comma', function() {
			setText( '   ' );
			sendKeyPress( charCodes.comma );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar' ] );
		} );

		it( 'should add a token when comma pressed', function() {
			setText( 'baz' );
			sendKeyPress( charCodes.comma );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz' ] );
		} );

		it( 'should not add a token when < pressed', function() {
			setText( 'baz' );
			sendKeyDown( keyCodes.comma, true );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar' ] );
			// The text input does not register the < keypress when it is sent this way.
			expect( textInputNode.prop( 'value' ) ).toBe( 'baz' );
		} );

		it( 'should trim token values when adding', function() {
			setText( '  baz  ' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz' ] );
		} );

		function testOnBlur( initialText, selectSuggestion, expectedSuggestion, expectedTokens ) {
			setText( initialText );
			if ( selectSuggestion ) {
				sendKeyDown( keyCodes.downArrow ); // 'the'
				sendKeyDown( keyCodes.downArrow ); // 'to'
			}
			expect( getSelectedSuggestion() ).toEqual( expectedSuggestion );

			function testSavedState( isActive ) {
				expect( wrapper.state( 'tokens' ) ).toEqual( expectedTokens );
				expect( textInputNode.prop( 'value' ) ).toBe( '' );
				expect( getSelectedSuggestion() ).toBe( null );
				expect( wrapper.find( 'div' ).first().hasClass( 'is-active' ) ).toBe( isActive );
			}

			document.activeElement.blur();
			textInputNode.simulate( 'blur' );
			testSavedState( false );
			textInputNode.simulate( 'focus' );
			testSavedState( true );
		}

		it( 'should add the current text when the input field loses focus', function() {
			testOnBlur(
				't', // initialText
				false, // selectSuggestion
				null, // expectedSuggestion
				[ 'foo', 'bar', 't' ] // expectedTokens
			);
		} );

		it( 'shouldn\'t show any suggestion when the initial text is smaller than two characters', function() {
			testOnBlur(
				't', // initialText
				true, // selectSuggestion
				null, // expectedSuggestion
				[ 'foo', 'bar', 'to' ] // expectedTokens
			);
		} );

		it( 'should add the suggested token when the (non-blank) input field loses focus', function() {
			testOnBlur(
				'to', // initialText
				true, // selectSuggestion
				[ 'to' ], // expectedSuggestion
				[ 'foo', 'bar', 'to' ] // expectedTokens
			);
		} );

		it( 'should not lose focus when a suggestion is clicked', function() {
			// prevents regression of https://github.com/Automattic/wp-calypso/issues/1884
			setText( 'th' );
			const firstSuggestion = wrapper.find( '.components-form-token-field__suggestion' ).at( 0 );
			firstSuggestion.simulate( 'click' );

			// wait for setState call
			jest.runTimersToTime( 10 );

			expect( wrapper.find( 'div' ).first().hasClass( 'is-active' ) ).toBe( true );
		} );

		it( 'should add tokens in the middle of the current tokens', function() {
			sendKeyDown( keyCodes.leftArrow );
			setText( 'baz' );
			sendKeyDown( keyCodes.tab );
			setText( 'quux' );
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'baz', 'quux', 'bar' ] );
		} );

		it( 'should add tokens from the selected matching suggestion using Tab', function() {
			setText( 'th' );
			expect( getSelectedSuggestion() ).toBe( null );
			sendKeyDown( keyCodes.downArrow ); // 'the'
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'e' ] );
			sendKeyDown( keyCodes.downArrow ); // 'that'
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'at' ] );
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'that' ] );
			expect( getSelectedSuggestion() ).toBe( null );
		} );

		it( 'should add tokens from the selected matching suggestion using Enter', function() {
			setText( 'th' );
			expect( getSelectedSuggestion() ).toBe( null );
			sendKeyDown( keyCodes.downArrow ); // 'the'
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'e' ] );
			sendKeyDown( keyCodes.downArrow ); // 'that'
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'at' ] );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'that' ] );
			expect( getSelectedSuggestion() ).toBe( null );
		} );
	} );

	describe( 'adding multiple tokens when pasting', function() {
		it( 'should add multiple comma-separated tokens when pasting', function() {
			setText( 'baz, quux, wut' );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz', 'quux' ] );
			expect( textInputNode.prop( 'value' ) ).toBe( ' wut' );
			setText( 'wut,' );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz', 'quux', 'wut' ] );
			expect( textInputNode.prop( 'value' ) ).toBe( '' );
		} );

		it( 'should add multiple tab-separated tokens when pasting', function() {
			setText( 'baz\tquux\twut' );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz', 'quux' ] );
			expect( textInputNode.prop( 'value' ) ).toBe( 'wut' );
		} );

		it( 'should not duplicate tokens when pasting', function() {
			setText( 'baz \tbaz,  quux \tquux,quux , wut  \twut, wut' );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz', 'quux', 'wut' ] );
			expect( textInputNode.prop( 'value' ) ).toBe( ' wut' );
		} );

		it( 'should skip empty tokens at the beginning of a paste', function() {
			setText( ',  ,\t \t  ,,baz, quux' );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz' ] );
			expect( textInputNode.prop( 'value' ) ).toBe( ' quux' );
		} );

		it( 'should skip empty tokens in the middle of a paste', function() {
			setText( 'baz,  ,\t \t  ,,quux' );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz' ] );
			expect( textInputNode.prop( 'value' ) ).toBe( 'quux' );
		} );

		it( 'should skip empty tokens at the end of a paste', function() {
			setText( 'baz, quux,  ,\t \t  ,,   ' );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo', 'bar', 'baz', 'quux' ] );
			expect( textInputNode.prop( 'value' ) ).toBe( '   ' );
		} );
	} );

	describe( 'removing tokens', function() {
		it( 'should remove tokens when X icon clicked', function() {
			wrapper.find( '.components-form-token-field__remove-token' ).first().simulate( 'click' );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'bar' ] );
		} );

		it( 'should remove the token to the left when backspace pressed', function() {
			sendKeyDown( keyCodes.backspace );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'foo' ] );
		} );

		it( 'should remove the token to the right when delete pressed', function() {
			sendKeyDown( keyCodes.leftArrow );
			sendKeyDown( keyCodes.leftArrow );
			sendKeyDown( keyCodes.delete );
			expect( wrapper.state( 'tokens' ) ).toEqual( [ 'bar' ] );
		} );
	} );
} );
