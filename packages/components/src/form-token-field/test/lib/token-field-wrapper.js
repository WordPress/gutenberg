/**
 * External dependencies
 */
import { unescape } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import fixtures from './fixtures';
import TokenField from '../../';

const {
	specialSuggestions: { default: suggestions },
} = fixtures;

function unescapeAndFormatSpaces( str ) {
	const nbsp = String.fromCharCode( 160 );
	return unescape( str ).replace( / /g, nbsp );
}

class TokenFieldWrapper extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			tokenSuggestions: suggestions,
			tokens: Object.freeze( [ 'foo', 'bar' ] ),
			isExpanded: false,
		};
		this.onTokensChange = this.onTokensChange.bind( this );
	}

	render() {
		return (
			<TokenField
				suggestions={
					this.state.isExpanded ? this.state.tokenSuggestions : null
				}
				value={ this.state.tokens }
				displayTransform={ unescapeAndFormatSpaces }
				onChange={ this.onTokensChange }
			/>
		);
	}

	onTokensChange( value ) {
		this.setState( { tokens: value } );
	}
}

module.exports = TokenFieldWrapper;
