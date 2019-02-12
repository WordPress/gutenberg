/** @flow
 * @format */

import jsdom from 'jsdom-jscore';
import jsdomLevel1Core from 'jsdom-jscore/lib/jsdom/level1/core';

// must be called to initialize jsdom before patching prototypes
const doc = jsdom.html( '', null, null );

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

Node.prototype.contains = function(otherNode) {
	return this === otherNode
		|| Array.prototype.some.call(this._childNodes, childNode => {
			return childNode.contains(otherNode);
		});
};

// copied from jsdom-jscore, but without WRONG_DOCUMENT_ERR exception
Node.prototype.insertBefore =  function(/* Node */ newChild, /* Node*/ refChild) {
	if (this._readonly === true) {
		throw new core.DOMException(NO_MODIFICATION_ALLOWED_ERR, 'Attempting to modify a read-only node');
	}

	// Adopt unowned children, for weird nodes like DocumentType
	if (!newChild._ownerDocument) newChild._ownerDocument = this._ownerDocument;


	/*
	 * This is commented out to prevent WrongDocumentError
	 * see: https://github.com/jsdom/jsdom/issues/717
	 *
	// TODO - if (!newChild) then?
	if (newChild._ownerDocument !== this._ownerDocument) {
		throw new core.DOMException(WRONG_DOCUMENT_ERR);
	}
	*/

	if (newChild.nodeType && newChild.nodeType === ATTRIBUTE_NODE) {
		throw new core.DOMException(HIERARCHY_REQUEST_ERR);
	}

	// search for parents matching the newChild
	var current = this;
	do {
		if (current === newChild) {
			throw new core.DOMException(HIERARCHY_REQUEST_ERR);
		}
	} while((current = current._parentNode));

	// fragments are merged into the element
	if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
		var tmpNode, i = newChild._childNodes.length;
		while (i-- > 0) {
			tmpNode = newChild.removeChild(newChild.firstChild);
			this.insertBefore(tmpNode, refChild);
		}
	} else if (newChild === refChild) {
		return newChild;
	} else {
		// if the newChild is already in the tree elsewhere, remove it first
		if (newChild._parentNode) {
			newChild._parentNode.removeChild(newChild);
		}

		if (refChild == null) {
			var refChildIndex = this._childNodes.length;
		} else {
			var refChildIndex = this._indexOf(refChild);
			if (refChildIndex == -1) {
				throw new core.DOMException(NOT_FOUND_ERR);
			}
		}

		Array.prototype.splice.call(this._childNodes, refChildIndex, 0, newChild);

		newChild._parentNode = this;
		if (this._attached && newChild._attach) {
			newChild._attach();
		}

		this._modified();
	}

	return newChild;
}; // raises(DOMException);

// alias (polyfill not needed)
// see: https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
Element.prototype.matches = Element.prototype.matchesSelector;
