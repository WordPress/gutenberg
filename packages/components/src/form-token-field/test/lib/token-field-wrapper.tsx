/**
 * External dependencies
 */
import { unescape } from 'lodash';
import type { ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import fixtures from './fixtures';
import type { FormTokenFieldProps } from '../../types';
import FormTokenField from '../../';

const {
	specialSuggestions: { default: suggestions },
} = fixtures;

function unescapeAndFormatSpaces( str: string ) {
	const nbsp = String.fromCharCode( 160 );
	return unescape( str ).replace( / /g, nbsp );
}

class TokenFieldWrapper extends Component<
	FormTokenFieldProps,
	{
		tokenSuggestions: ComponentProps<
			typeof FormTokenField
		>[ 'suggestions' ];
		tokens: ComponentProps< typeof FormTokenField >[ 'value' ];
		isExpanded: boolean;
	}
> {
	constructor( props: FormTokenFieldProps ) {
		super( props );
		this.state = {
			tokenSuggestions: suggestions,
			tokens: Object.freeze( [ 'foo', 'bar' ] ) as string[],
			isExpanded: false,
		};
		this.onTokensChange = this.onTokensChange.bind( this );
	}

	render() {
		return (
			<FormTokenField
				suggestions={
					this.state.isExpanded
						? this.state.tokenSuggestions
						: undefined
				}
				value={ this.state.tokens }
				displayTransform={ unescapeAndFormatSpaces }
				onChange={ this.onTokensChange }
				{ ...this.props }
			/>
		);
	}

	onTokensChange(
		value: ComponentProps< typeof FormTokenField >[ 'value' ]
	) {
		this.setState( { tokens: value } );
	}
}

export default TokenFieldWrapper;
