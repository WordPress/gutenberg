/**
 * External dependencies
 */
import { uniq, compact, without } from 'lodash';

/**
 * A set of tokens.
 *
 * @see https://dom.spec.whatwg.org/#domtokenlist
 */
export default class TokenList {
	/**
	 * Constructs a new instance of TokenList.
	 *
	 * @param {string} initialValue Initial value to assign.
	 */
	constructor( initialValue = '' ) {
		this.value = initialValue;

		[ 'entries', 'forEach', 'keys', 'values' ].forEach( ( fn ) => {
			this[ fn ] = ( function() {
				return this._valueAsArray[ fn ]( ...arguments );
			} ).bind( this );
		} );
	}

	/**
	 * Returns the associated set as string.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-value
	 *
	 * @return {string} Token set as string.
	 */
	get value() {
		return this._currentValue;
	}

	/**
	 * Replaces the associated set with a new string value.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-value
	 *
	 * @param {string} value New token set as string.
	 */
	set value( value ) {
		value = String( value );
		this._valueAsArray = uniq( compact( value.split( /\s+/g ) ) );
		this._currentValue = this._valueAsArray.join( ' ' );
	}

	/**
	 * Returns the number of tokens.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-length
	 *
	 * @return {number} Number of tokens.
	 */
	get length() {
		return this._valueAsArray.length;
	}

	/**
	 * Returns the stringified form of the TokenList.
	 *
	 * @see https://dom.spec.whatwg.org/#DOMTokenList-stringification-behavior
	 * @see https://www.ecma-international.org/ecma-262/9.0/index.html#sec-tostring
	 *
	 * @return {string} Token set as string.
	 */
	toString() {
		return this.value;
	}

	/**
	 * Returns an iterator for the TokenList, iterating items of the set.
	 *
	 * @see https://dom.spec.whatwg.org/#domtokenlist
	 *
	 * @return {Generator} TokenList iterator.
	 */
	* [ Symbol.iterator ]() {
		return yield* this._valueAsArray;
	}

	/**
	 * Returns the token with index `index`.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-item
	 *
	 * @param {number} index Index at which to return token.
	 *
	 * @return {?string} Token at index.
	 */
	item( index ) {
		return this._valueAsArray[ index ];
	}

	/**
	 * Returns true if `token` is present, and false otherwise.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-contains
	 *
	 * @param {string} item Token to test.
	 *
	 * @return {boolean} Whether token is present.
	 */
	contains( item ) {
		return this._valueAsArray.indexOf( item ) !== -1;
	}

	/**
	 * Adds all arguments passed, except those already present.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-add
	 *
	 * @param {...string} items Items to add.
	 */
	add( ...items ) {
		this.value += ' ' + items.join( ' ' );
	}

	/**
	 * Removes arguments passed, if they are present.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-remove
	 *
	 * @param {...string} items Items to remove.
	 */
	remove( ...items ) {
		this.value = without( this._valueAsArray, ...items ).join( ' ' );
	}

	/**
	 * If `force` is not given, "toggles" `token`, removing it if it’s present
	 * and adding it if it’s not present. If `force` is true, adds token (same
	 * as add()). If force is false, removes token (same as remove()). Returns
	 * true if `token` is now present, and false otherwise.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-toggle
	 *
	 * @param {string}   token Token to toggle.
	 * @param {?boolean} force Presence to force.
	 *
	 * @return {boolean} Whether token is present after toggle.
	 */
	toggle( token, force ) {
		if ( undefined === force ) {
			force = ! this.contains( token );
		}

		if ( force ) {
			this.add( token );
		} else {
			this.remove( token );
		}

		return force;
	}

	/**
	 * Replaces `token` with `newToken`. Returns true if `token` was replaced
	 * with `newToken`, and false otherwise.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-replace
	 *
	 * @param {string} token    Token to replace with `newToken`.
	 * @param {string} newToken Token to use in place of `token`.
	 *
	 * @return {boolean} Whether replacement occurred.
	 */
	replace( token, newToken ) {
		if ( ! this.contains( token ) ) {
			return false;
		}

		this.remove( token );
		this.add( newToken );

		return true;
	}

	/**
	 * Returns true if `token` is in the associated attribute’s supported
	 * tokens. Returns false otherwise.
	 *
	 * Always returns `true` in this implementation.
	 *
	 * @see https://dom.spec.whatwg.org/#dom-domtokenlist-supports
	 *
	 * @return {boolean} Whether token is supported.
	 */
	supports() {
		return true;
	}
}
