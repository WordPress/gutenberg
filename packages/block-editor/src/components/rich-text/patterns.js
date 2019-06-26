/**
 * WordPress dependencies
 */
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
import { slice } from '@wordpress/rich-text';

export function getInputRule( onReplace ) {
	if ( ! onReplace ) {
		return;
	}

	const prefixTransforms = getBlockTransforms( 'from' )
		.filter( ( { type } ) => type === 'prefix' );

	return ( value, valueToFormat ) => {
		const { start, text } = value;
		const characterBefore = text.slice( start - 1, start );

		if ( ! /\s/.test( characterBefore ) ) {
			return value;
		}

		const trimmedTextBefore = text.slice( 0, start ).trim();
		const transformation = findTransform( prefixTransforms, ( { prefix } ) => {
			return trimmedTextBefore === prefix;
		} );

		if ( ! transformation ) {
			return value;
		}

		const content = valueToFormat( slice( value, start, text.length ) );
		const block = transformation.transform( content );

		onReplace( [ block ] );
	};
}

export function getEnterRule( onReplace ) {
	if ( ! onReplace ) {
		return;
	}

	const transforms = getBlockTransforms( 'from' )
		.filter( ( { type } ) => type === 'enter' );

	return ( value ) => {
		const { text } = value;
		const transformation = findTransform( transforms, ( item ) => {
			return item.regExp.test( text );
		} );

		if ( ! transformation ) {
			return value;
		}

		onReplace( [
			transformation.transform( { content: text } ),
		] );
	};
}
