/** @flow
 * @format */

/**
* This file is used in src/globals.js to patch jsdom-jscore.
*
* Node.prototype.contains is implemented as a simple recursive function.
*
* Node.prototype.insertBefore is re-implemented (code copied) with the
* WrongDocumentError exception disabled.
*
* Element.prototype.matches is aliased to Element.prototype.matchesSelector.
*/

/**
 * External dependencies
 */
import jsdom from 'jsdom-jscore';
import jsdomLevel1Core from 'jsdom-jscore/lib/jsdom/level1/core';

// must be called to initialize jsdom before patching prototypes
jsdom.html( '', null, null );

const { core } = jsdomLevel1Core.dom.level1;
const { Node, Element } = core;

// Exception codes
const {
	NO_MODIFICATION_ALLOWED_ERR,
	HIERARCHY_REQUEST_ERR,
	NOT_FOUND_ERR,
} = core;

// Node types
const {
	ATTRIBUTE_NODE,
	DOCUMENT_FRAGMENT_NODE,
} = Node;

/**
 * Simple recursive implementation of Node.contains method
 * @param {number} otherNode Another node (may be the same node).
 * @return {boolean} true if otherNode is a descendant of this node, or is this
 * node, false otherwise.
 *
 * This function is necessary in the mobile environment, because there are code
 * paths that make use of functions in the Gutenberg (web) project, which has
 * expectation that this is implemented (as it is in the browser environment).
 */
Node.prototype.contains = function( otherNode ) {
	return this === otherNode ||
		Array.prototype.some.call( this._childNodes, ( childNode ) => {
			return childNode.contains( otherNode );
		} );
};

/**
 * Copy of insertBefore function from jsdom-jscore, WRONG_DOCUMENT_ERR exception
 * disabled.
 * @param {Object} newChild The node to be insterted.
 * @param {Object} refChild The node before which newChild is inserted.
 * @return {Object} the newly inserted child node
 *
 * This function is modified here to remove the WRONG_DOCUMENT_ERR exception
 * that is no longer part of the DOM spec for this function.
 * see: https://github.com/jsdom/jsdom/issues/717 for more information, * and:
 * https://dom.spec.whatwg.org/#dom-node-insertbefore for the latest spec.
 */
Node.prototype.insertBefore = function( /* Node */ newChild, /* Node*/ refChild ) {
	if ( this._readonly === true ) {
		throw new core.DOMException( NO_MODIFICATION_ALLOWED_ERR, 'Attempting to modify a read-only node' );
	}

	// Adopt unowned children, for weird nodes like DocumentType
	if ( ! newChild._ownerDocument ) {
		newChild._ownerDocument = this._ownerDocument;
	}

	/*
	 * This is commented out to prevent WrongDocumentError
	 * see: https://github.com/jsdom/jsdom/issues/717
	 *
	// TODO - if (!newChild) then?
	if (newChild._ownerDocument !== this._ownerDocument) {
		throw new core.DOMException(WRONG_DOCUMENT_ERR);
	}
	*/

	if ( newChild.nodeType && newChild.nodeType === ATTRIBUTE_NODE ) {
		throw new core.DOMException( HIERARCHY_REQUEST_ERR );
	}

	// search for parents matching the newChild
	let current = this;
	do {
		if ( current === newChild ) {
			throw new core.DOMException( HIERARCHY_REQUEST_ERR );
		}
	} while ( ( current = current._parentNode ) );

	// fragments are merged into the element
	if ( newChild.nodeType === DOCUMENT_FRAGMENT_NODE ) {
		let tmpNode,
			i = newChild._childNodes.length;
		while ( i-- > 0 ) {
			tmpNode = newChild.removeChild( newChild.firstChild );
			this.insertBefore( tmpNode, refChild );
		}
	} else if ( newChild === refChild ) {
		return newChild;
	} else {
		// if the newChild is already in the tree elsewhere, remove it first
		if ( newChild._parentNode ) {
			newChild._parentNode.removeChild( newChild );
		}

		if ( refChild === null ) {
			// eslint-disable-next-line no-var
			var refChildIndex = this._childNodes.length;
		} else {
			// eslint-disable-next-line no-redeclare, no-var
			var refChildIndex = this._indexOf( refChild );
			if ( refChildIndex === -1 ) {
				throw new core.DOMException( NOT_FOUND_ERR );
			}
		}

		Array.prototype.splice.call( this._childNodes, refChildIndex, 0, newChild );

		newChild._parentNode = this;
		if ( this._attached && newChild._attach ) {
			newChild._attach();
		}

		this._modified();
	}

	return newChild;
}; // raises(DOMException);

/*
 * This is merely an alias (polyfill not needed).
 * see: https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
 *
 * This function is necessary in the mobile environment, because there are code
 * paths that make use of functions in the Gutenberg (web) project, which has
 * expectation that this is implemented (as it is in the browser environment).
 */
Element.prototype.matches = Element.prototype.matchesSelector;
