/**
 * This file is used in src/globals.js to patch jsdom-jscore.
 *
 * Node.prototype.contains is implemented as a simple recursive function.
 *
 * Node.prototype.insertBefore is re-implemented (code copied) with the
 * WrongDocumentError exception disabled.
 *
 * Element.prototype.matches is aliased to Element.prototype.matchesSelector.
 *
 * Getters are defined on the Node.prototype for the following properties:
 * parentElement, previousElementSibling, nextElementSibling.
 */

/**
 * External dependencies
 */
import jsdom from 'jsdom-jscore-rn';
import jsdomLevel1Core from 'jsdom-jscore-rn/lib/jsdom/level1/core';

// Must be called to initialize jsdom before patching prototypes.
jsdom.html( '', null, null );

const { core } = jsdomLevel1Core.dom.level1;
const { Node, Element, CharacterData } = core;

// Exception codes.
const {
	NO_MODIFICATION_ALLOWED_ERR,
	HIERARCHY_REQUEST_ERR,
	NOT_FOUND_ERR,
} = core;

/**
 * Simple recursive implementation of Node.contains method
 *
 * @param {number} otherNode Another node (may be the same node).
 * @return {boolean} true if otherNode is a descendant of this node, or is this
 * node, false otherwise.
 *
 * This function is necessary in the mobile environment, because there are code
 * paths that make use of functions in the Gutenberg (web) project, which has
 * expectation that this is implemented (as it is in the browser environment).
 */
Node.prototype.contains = function ( otherNode ) {
	return (
		this === otherNode ||
		Array.prototype.some.call( this._childNodes, ( childNode ) => {
			return childNode.contains( otherNode );
		} )
	);
};

/**
 * Copy of insertBefore function from jsdom-jscore, WRONG_DOCUMENT_ERR exception
 * disabled.
 *
 * @param {Object} newChild The node to be insterted.
 * @param {Object} refChild The node before which newChild is inserted.
 * @return {Object} the newly inserted child node
 *
 * This function is modified here to remove the WRONG_DOCUMENT_ERR exception
 * that is no longer part of the DOM spec for this function.
 * see: https://github.com/jsdom/jsdom/issues/717 for more information, * and:
 * https://dom.spec.whatwg.org/#dom-node-insertbefore for the latest spec.
 */
Node.prototype.insertBefore = function (
	/* Node. */ newChild,
	/* Node. */ refChild
) {
	if ( this._readonly === true ) {
		throw new core.DOMException(
			NO_MODIFICATION_ALLOWED_ERR,
			'Attempting to modify a read-only node'
		);
	}

	// Adopt unowned children, for weird nodes like DocumentType.
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

	if ( newChild.nodeType && newChild.nodeType === newChild.ATTRIBUTE_NODE ) {
		throw new core.DOMException( HIERARCHY_REQUEST_ERR );
	}

	// Search for parents matching the newChild.
	let current = this;
	do {
		if ( current === newChild ) {
			throw new core.DOMException( HIERARCHY_REQUEST_ERR );
		}
	} while ( ( current = current._parentNode ) );

	// Fragments are merged into the element.
	if ( newChild.nodeType === newChild.DOCUMENT_FRAGMENT_NODE ) {
		let tmpNode,
			i = newChild._childNodes.length;
		while ( i-- > 0 ) {
			tmpNode = newChild.removeChild( newChild.firstChild );
			this.insertBefore( tmpNode, refChild );
		}
	} else if ( newChild === refChild ) {
		return newChild;
	} else {
		// If the newChild is already in the tree elsewhere, remove it first.
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

		Array.prototype.splice.call(
			this._childNodes,
			refChildIndex,
			0,
			newChild
		);

		newChild._parentNode = this;
		if ( this._attached && newChild._attach ) {
			newChild._attach();
		}

		this._modified();
	}

	return newChild;
}; // Raises(DOMException);

/*
 * This is merely an alias (polyfill not needed).
 * see: https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
 *
 * This function is necessary in the mobile environment, because there are code
 * paths that make use of functions in the Gutenberg (web) project, which has
 * expectation that this is implemented (as it is in the browser environment).
 */
Element.prototype.matches = Element.prototype.matchesSelector;

/*
 * Implementation of Element.prototype.closest that it's missing from the jsdom-jscore fork we're using.
 * See https://github.com/wordpress-mobile/gutenberg-mobile/issues/1625
 */
Element.prototype.closest = function ( selector ) {
	let el = this;
	while ( el ) {
		if ( el.matches( selector ) ) {
			return el;
		}
		el = el.parentElement;
	}
	return null;
};

/**
 * Helper function to check if a node implements the NonDocumentTypeChildNode
 * interface
 *
 * @param {Object} node Node to check
 * @return {boolean} true if node is a NonDocumentTypeChildNode, false otherwise
 *
 * This function is needed to implement the previousElementSibling and
 * nextElementSibling properties.
 * See: https://dom.spec.whatwg.org/#interface-nondocumenttypechildnode
 */
function isNonDocumentTypeChildNode( node ) {
	return node instanceof Element || node instanceof CharacterData;
}

// $FlowFixMe.
Object.defineProperties( Node.prototype, {
	/*
	 * This defines parentElement property on the Node prototype using a getter.
	 * See: https://dom.spec.whatwg.org/#parent-element
	 */
	parentElement: {
		get() {
			const parent = this.parentNode;

			if ( parent && parent.nodeType === parent.ELEMENT_NODE ) {
				return parent;
			}

			return null;
		},
	},
	/*
	 * This defines previousElementSibling property on the Node prototype using a
	 * getter.
	 * See: https://dom.spec.whatwg.org/#dom-nondocumenttypechildnode-previouselementsibling
	 */
	previousElementSibling: {
		get() {
			// Property is undefined if node is not a NonDocumentTypeChildNode.
			if ( ! isNonDocumentTypeChildNode( this ) ) {
				return;
			}

			let sibling = this.previousSibling;

			while ( sibling && sibling.nodeType !== sibling.ELEMENT_NODE ) {
				sibling = sibling.previousSibling;
			}

			return sibling;
		},
	},
	/*
	 * This defines nextElementSibling property on the Node prototype using a
	 * getter.
	 * See: https://dom.spec.whatwg.org/#dom-nondocumenttypechildnode-nextelementsibling
	 */
	nextElementSibling: {
		get() {
			// Property is undefined if node is not a NonDocumentTypeChildNode.
			if ( ! isNonDocumentTypeChildNode( this ) ) {
				return;
			}

			let sibling = this.nextSibling;

			while ( sibling && sibling.nodeType !== sibling.ELEMENT_NODE ) {
				sibling = sibling.nextSibling;
			}

			return sibling;
		},
	},
} );

class DOMParser {
	// This is required for the stripHTML function, but it doesn't necessarily
	// conform to the DOM standard.
	// See https://github.com/wordpress-mobile/gutenberg-mobile/pull/1771
	parseFromString( string ) {
		return jsdom.html( string );
	}
}

global.DOMParser = DOMParser;
