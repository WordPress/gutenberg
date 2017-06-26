/**
 * External dependencies
 */
import { expect } from 'chai';
import { filter, map } from 'lodash';
import { test } from 'sinon';
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
	'delete': 46,
	comma: 188,
};

const charCodes = {
	comma: 44,
};

describe( 'FormTokenField', function() {
	if ( ! process.env.RUN_SLOW_TESTS ) {
		return;
	}

	let wrapper, tokenFieldNode, textInputNode;

	function setText( text ) {
		textInputNode.simulate( 'change', { target: { value: text } } );
	}

	function sendKeyDown( keyCode, shiftKey ) {
		tokenFieldNode.simulate( 'keyDown', {
			keyCode: keyCode,
			shiftKey: ! ! shiftKey,
		} );
	}

	function sendKeyPress( charCode ) {
		tokenFieldNode.simulate( 'keyPress', {
			charCode: charCode,
		} );
	}

	function getNodeInnerHtml( node ) {
		const div = document.createElement( 'div' );
		div.innerHTML = node.html();
		return div.firstChild.innerHTML;
	}

	function getTokensHTML() {
		const textNodes = tokenFieldNode.find( '.components-form-token-field__token-text' );

		return textNodes.map( getNodeInnerHtml );
	}

	function getSuggestionsText( selector ) {
		const suggestionNodes = tokenFieldNode.find( selector || '.components-form-token-field__suggestion' );

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
		tokenFieldNode = wrapper.ref( 'tokenField' );
		textInputNode = tokenFieldNode.find( '.components-form-token-field__input' );
		textInputNode.simulate( 'focus' );
	} );

	describe( 'displaying tokens', function() {
		it( 'should render default tokens', function() {
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar' ] );
		} );

		it( 'should display tokens with escaped special characters properly', function() {
			wrapper.setState( {
				tokens: fixtures.specialTokens.textEscaped,
			} );
			expect( getTokensHTML() ).to.deep.equal( fixtures.specialTokens.htmlEscaped );
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
			expect( getTokensHTML() ).to.deep.equal( fixtures.specialTokens.htmlUnescaped );
		} );
	} );

	describe( 'suggestions', function() {
		it( 'should not render suggestions unless we type at least two characters', function() {
			expect( getSuggestionsText() ).to.eql( [] );
			setText( 'th' );
			expect( getSuggestionsText() ).to.eql( fixtures.matchingSuggestions.th );
		} );

		it( 'should remove already added tags from suggestions', function() {
			wrapper.setState( {
				tokens: Object.freeze( [ 'of', 'and' ] ),
			} );
			expect( getSuggestionsText() ).to.not.include.members( getTokensHTML() );
		} );

		it( 'suggestions that begin with match are boosted', function() {
			setText( 'so' );
			expect( getSuggestionsText() ).to.deep.equal( fixtures.matchingSuggestions.so );
		} );

		it( 'should match against the unescaped values of suggestions with special characters', function() {
			setText( '& S' );
			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
			} );
			expect( getSuggestionsText() ).to.deep.equal( fixtures.specialSuggestions.matchAmpersandUnescaped );
		} );

		it( 'should match against the unescaped values of suggestions with special characters (including spaces)', function() {
			setText( 's &' );
			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
			} );
			expect( getSuggestionsText() ).to.deep.equal( fixtures.specialSuggestions.matchAmpersandSequence );
		} );

		it( 'should not match against the escaped values of suggestions with special characters', function() {
			setText( 'amp' );
			wrapper.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
			} );
			expect( getSuggestionsText() ).to.deep.equal( fixtures.specialSuggestions.matchAmpersandEscaped );
		} );

		it( 'should match suggestions even with trailing spaces', function() {
			setText( '  at  ' );
			expect( getSuggestionsText() ).to.deep.equal( fixtures.matchingSuggestions.at );
		} );

		it( 'should manage the selected suggestion based on both keyboard and mouse events', test( function() {
			// We need a high timeout here to accomodate Travis CI
			this.timeout( 10000 );

			setText( 'th' );
			expect( getSuggestionsText() ).to.deep.equal( fixtures.matchingSuggestions.th );
			expect( getSelectedSuggestion() ).to.equal( null );
			sendKeyDown( keyCodes.downArrow ); // 'the'
			expect( getSelectedSuggestion() ).to.deep.equal( [ 'th', 'e' ] );
			sendKeyDown( keyCodes.downArrow ); // 'that'
			expect( getSelectedSuggestion() ).to.deep.equal( [ 'th', 'at' ] );

			const hoverSuggestion = tokenFieldNode.find( '.components-form-token-field__suggestion' ).at( 3 ); // 'with'
			expect( getSuggestionNodeText( hoverSuggestion ) ).to.deep.equal( [ 'wi', 'th' ] );

			// before sending a hover event, we need to wait for
			// SuggestionList#_scrollingIntoView to become false
			this.clock.tick( 100 );

			hoverSuggestion.simulate( 'mouseEnter' );
			expect( getSelectedSuggestion() ).to.deep.equal( [ 'wi', 'th' ] );
			sendKeyDown( keyCodes.upArrow );
			expect( getSelectedSuggestion() ).to.deep.equal( [ 'th', 'is' ] );
			sendKeyDown( keyCodes.upArrow );
			expect( getSelectedSuggestion() ).to.deep.equal( [ 'th', 'at' ] );
			hoverSuggestion.simulate( 'click' );
			expect( getSelectedSuggestion() ).to.equal( null );
			expect( getTokensHTML() ).to.deep.equal( [ 'foo', 'bar', 'with' ] );
		} ) );
	} );

	describe( 'adding tokens', function() {
		it( 'should add a token when Tab pressed', function() {
			setText( 'baz' );
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( '' );
		} );

		it( 'should not allow adding blank tokens with Tab', function() {
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar' ] );
		} );

		it( 'should not allow adding whitespace tokens with Tab', function() {
			setText( '   ' );
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar' ] );
		} );

		it( 'should add a token when Enter pressed', function() {
			setText( 'baz' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( '' );
		} );

		it( 'should not allow adding blank tokens with Enter', function() {
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar' ] );
		} );

		it( 'should not allow adding whitespace tokens with Enter', function() {
			setText( '   ' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar' ] );
		} );

		it( 'should not allow adding whitespace tokens with comma', function() {
			setText( '   ' );
			sendKeyPress( charCodes.comma );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar' ] );
		} );

		it( 'should add a token when comma pressed', function() {
			setText( 'baz' );
			sendKeyPress( charCodes.comma );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz' ] );
		} );

		it( 'should not add a token when < pressed', function() {
			setText( 'baz' );
			sendKeyDown( keyCodes.comma, true );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar' ] );
			// The text input does not register the < keypress when it is sent this way.
			expect( textInputNode.prop( 'value' ) ).to.equal( 'baz' );
		} );

		it( 'should trim token values when adding', function() {
			setText( '  baz  ' );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz' ] );
		} );

		function testOnBlur( initialText, selectSuggestion, expectedSuggestion, expectedTokens ) {
			setText( initialText );
			if ( selectSuggestion ) {
				sendKeyDown( keyCodes.downArrow ); // 'the'
				sendKeyDown( keyCodes.downArrow ); // 'to'
			}
			expect( getSelectedSuggestion() ).to.deep.equal( expectedSuggestion );

			function testSavedState( isActive ) {
				expect( wrapper.state( 'tokens' ) ).to.deep.equal( expectedTokens );
				expect( textInputNode.prop( 'value' ) ).to.equal( '' );
				expect( getSelectedSuggestion() ).to.equal( null );
				expect( tokenFieldNode.find( 'div' ).first().hasClass( 'is-active' ) ).to.equal( isActive );
			}

			document.activeElement.blur();
			textInputNode.simulate( 'blur' );
			testSavedState( false );
			textInputNode.simulate( 'focus' );
			testSavedState( true );
		}

		it( 'should add the current text when the input field loses focus', test( function() {
			testOnBlur(
				't',                   // initialText
				false,                 // selectSuggestion
				null,                  // expectedSuggestion
				[ 'foo', 'bar', 't' ]  // expectedTokens
			);
		} ) );

		it( 'shouldn\'t show any suggestion when the initial text is smaller than two characters', test( function() {
			testOnBlur(
				't',                    // initialText
				true,                   // selectSuggestion
				null,                   // expectedSuggestion
				[ 'foo', 'bar', 'to' ]  // expectedTokens
			);
		} ) );

		it( 'should add the suggested token when the (non-blank) input field loses focus', test( function() {
			testOnBlur(
				'to',                    // initialText
				true,                    // selectSuggestion
				[ 'to' ],            // expectedSuggestion
				[ 'foo', 'bar', 'to' ]   // expectedTokens
			);
		} ) );

		it( 'should not lose focus when a suggestion is clicked', test( function() {
			// prevents regression of https://github.com/Automattic/wp-calypso/issues/1884
			setText( 'th' );
			const firstSuggestion = tokenFieldNode.find( '.components-form-token-field__suggestion' ).at( 0 );
			firstSuggestion.simulate( 'click' );

			// wait for setState call
			this.clock.tick( 10 );

			expect( tokenFieldNode.find( 'div' ).first().hasClass( 'is-active' ) ).to.equal( true );
		} ) );

		it( 'should add tokens in the middle of the current tokens', function() {
			sendKeyDown( keyCodes.leftArrow );
			setText( 'baz' );
			sendKeyDown( keyCodes.tab );
			setText( 'quux' );
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'baz', 'quux', 'bar' ] );
		} );

		it( 'should add tokens from the selected matching suggestion using Tab', function() {
			setText( 'th' );
			expect( getSelectedSuggestion() ).to.equal( null );
			sendKeyDown( keyCodes.downArrow ); // 'the'
			expect( getSelectedSuggestion() ).to.deep.equal( [ 'th', 'e' ] );
			sendKeyDown( keyCodes.downArrow ); // 'that'
			expect( getSelectedSuggestion() ).to.deep.equal( [ 'th', 'at' ] );
			sendKeyDown( keyCodes.tab );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'that' ] );
			expect( getSelectedSuggestion() ).to.equal( null );
		} );

		it( 'should add tokens from the selected matching suggestion using Enter', function() {
			setText( 'th' );
			expect( getSelectedSuggestion() ).to.equal( null );
			sendKeyDown( keyCodes.downArrow ); // 'the'
			expect( getSelectedSuggestion() ).to.deep.equal( [ 'th', 'e' ] );
			sendKeyDown( keyCodes.downArrow ); // 'that'
			expect( getSelectedSuggestion() ).to.deep.equal( [ 'th', 'at' ] );
			sendKeyDown( keyCodes.enter );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'that' ] );
			expect( getSelectedSuggestion() ).to.equal( null );
		} );
	} );

	describe( 'adding multiple tokens when pasting', function() {
		it( 'should add multiple comma-separated tokens when pasting', function() {
			setText( 'baz, quux, wut' );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz', 'quux' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( ' wut' );
			setText( 'wut,' );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz', 'quux', 'wut' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( '' );
		} );

		it( 'should add multiple tab-separated tokens when pasting', function() {
			setText( 'baz\tquux\twut' );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz', 'quux' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( 'wut' );
		} );

		it( 'should not duplicate tokens when pasting', function() {
			setText( 'baz \tbaz,  quux \tquux,quux , wut  \twut, wut' );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz', 'quux', 'wut' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( ' wut' );
		} );

		it( 'should skip empty tokens at the beginning of a paste', function() {
			setText( ',  ,\t \t  ,,baz, quux' );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( ' quux' );
		} );

		it( 'should skip empty tokens at the beginning of a paste', function() {
			setText( ',  ,\t \t  ,,baz, quux' );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( ' quux' );
		} );

		it( 'should skip empty tokens in the middle of a paste', function() {
			setText( 'baz,  ,\t \t  ,,quux' );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( 'quux' );
		} );

		it( 'should skip empty tokens at the end of a paste', function() {
			setText( 'baz, quux,  ,\t \t  ,,   ' );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo', 'bar', 'baz', 'quux' ] );
			expect( textInputNode.prop( 'value' ) ).to.equal( '   ' );
		} );
	} );

	describe( 'removing tokens', function() {
		it( 'should remove tokens when X icon clicked', function() {
			tokenFieldNode.find( '.components-form-token-field__remove-token' ).first().simulate( 'click' );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'bar' ] );
		} );

		it( 'should remove the token to the left when backspace pressed', function() {
			sendKeyDown( keyCodes.backspace );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'foo' ] );
		} );

		it( 'should remove the token to the right when delete pressed', function() {
			sendKeyDown( keyCodes.leftArrow );
			sendKeyDown( keyCodes.leftArrow );
			sendKeyDown( keyCodes.delete );
			expect( wrapper.state( 'tokens' ) ).to.deep.equal( [ 'bar' ] );
		} );
	} );
} );
