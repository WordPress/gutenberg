/**
 * External dependencies
 */
import { createElement, Component, cloneElement, Children, isValidElement } from 'react';
import {
	render,
	findDOMNode,
	unstable_createPortal, // eslint-disable-line camelcase
	unstable_renderSubtreeIntoContainer, // eslint-disable-line camelcase
} from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { isString, castArray } from 'lodash';

const interops = [
	// {
	// 	isHandled: ( element ) => (
	// 		element.$$typeof === Symbol.for( 'react.element' )
	// 	),
	// 	render( element, target ) {
	// 		render( element, target );
	// 	},
	// },
	// {
	// 	isHandled: ( [ tagName ] ) => (
	// 		tagName && tagName.prototype instanceof Component
	// 	),
	// 	render( [ tagName, props, ...children ], target ) {
	// 		render(
	// 			createElement( tagName, props, children ),
	// 			target
	// 		);
	// 	},
	// },
	// {
	// 	isHandled: ( [ VueComponent ] ) => VueComponent.prototype instanceof Vue,
	// 	render( [ VueComponent, props, ...children ], target ) {
	// 		if ( ! target.firstChild ) {
	// 			const child = document.createElement( 'div' );
	// 			target.appendChild( child );
	// 		}

	// 		new Vue( {
	// 			el: target.firstChild,

	// 			functional: true,

	// 			render( h ) {
	// 				return h( VueComponent, { props }, children );
	// 			},
	// 		} );
	// 	},
	// },
];

class InteropRenderer extends Component {
	componentDidMount() {
		this.props.handler.render( this.props.element, this.node );
	}

	componentWillReceiveProps( nextProps ) {
		nextProps.handler.render( nextProps.element, this.node );
	}

	shouldComponentUpdate() {
		return false;
	}

	render() {
		return createElement( 'div', { ref: ( node ) => this.node = node } );
	}
}

export function buildVTree( element ) {
	if ( null === element || undefined === element ) {
		return null;
	}

	if ( isValidElement( element ) ) {
		return element;
	}

	// Defer to interoperability handler
	const handler = interops.find( ( interop ) => interop.isHandled( element ) );
	if ( handler ) {
		return createElement( InteropRenderer, {
			handler,
			element,
		} );
	}

	const [ type ] = element;

	// Handle React 16.x array render returns
	const isNodeType = 'function' === typeof type || 'string' === typeof type;
	if ( ! isNodeType ) {
		return castArray( element ).map( buildVTree );
	}

	// Handle case where children starts at second argument
	let [ , attributes, ...children ] = element;
	if ( attributes && attributes.constructor !== Object ) {
		children.unshift( attributes );
		attributes = null;
	}

	children = castArray( children ).map( ( child ) => {
		if ( 'boolean' === typeof child ) {
			child = null;
		}

		if ( null === child || undefined === child ) {
			child = '';
		} else if ( 'number' === typeof child ) {
			child = String( child );
		}

		if ( 'string' === typeof child ) {
			return child;
		}

		return buildVTree( child );
	} );

	switch ( typeof type ) {
		case 'string':
			return createElement( type, attributes, ...children );

		case 'function':
			return buildVTree( type( { ...attributes, children } ) );
	}
}

export function wpRender( element, target ) {
	render( buildVTree( element ), null, target );
}

/**
 * Returns a new element of given type. Type can be either a string tag name or
 * another function which itself returns an element.
 *
 * @param  {?(string|Function)} type     Tag name or element creator
 * @param  {Object}             props    Element properties, either attribute
 *                                       set to apply to DOM node or values to
 *                                       pass through to element creator
 * @param  {...WPElement}       children Descendant elements
 * @return {WPElement}                   Element
 */
export { createElement };

/**
 * Renders a given element into the target DOM node.
 *
 * @param {WPElement} element Element to render
 * @param {Element}   target  DOM node into which element should be rendered
 */
export { render };

/**
 * A base class to create WordPress Components (Refs, state and lifecycle hooks)
 */
export { Component };

/**
 * Creates a copy of an element with extended props.
 *
 * @param  {WPElement} element Element
 * @param  {?Object}   props   Props to apply to cloned element
 * @return {WPElement}         Cloned element
 */
export { cloneElement };

/**
 * Finds the dom node of a React component
 *
 * @param {Component} component component's instance
 * @param {Element}   target    DOM node into which element should be rendered
 */
export { findDOMNode };

export { Children };

/**
 * Creates a portal into which a component can be rendered.
 *
 * @see https://github.com/facebook/react/issues/10309#issuecomment-318433235
 *
 * @param {Component} component Component
 * @param {Element}   target    DOM node into which element should be rendered
 */
export { unstable_createPortal as createPortal }; // eslint-disable-line camelcase

export { unstable_renderSubtreeIntoContainer as renderSubtreeIntoContainer }; // eslint-disable-line camelcase

/**
 * Renders a given element into a string
 *
 * @param  {WPElement} element Element to render
 * @return {String}            HTML
 */
export function renderToString( element ) {
	if ( ! element ) {
		return '';
	}

	if ( 'string' === typeof element ) {
		return element;
	}

	if ( Array.isArray( element ) ) {
		// React 16 supports rendering array children of an element, but not as
		// an argument to the render methods directly. To support this, we pass
		// the array as children of a dummy wrapper, then remove the wrapper's
		// opening and closing tags.
		return renderToStaticMarkup(
			createElement( 'div', null, ...element )
		).slice( 5 /* <div> */, -6 /* </div> */ );
	}

	return renderToStaticMarkup( element );
}

/**
 * Concatenate two or more React children objects
 *
 * @param  {...?Object} childrenArguments Array of children arguments (array of arrays/strings/objects) to concatenate
 * @return {Array}                        The concatenated value
 */
export function concatChildren( ...childrenArguments ) {
	return childrenArguments.reduce( ( memo, children, i ) => {
		Children.forEach( children, ( child, j ) => {
			if ( child && 'string' !== typeof child ) {
				child = cloneElement( child, {
					key: [ i, j ].join(),
				} );
			}

			memo.push( child );
		} );

		return memo;
	}, [] );
}

/**
 * Switches the nodeName of all the elements in the children object
 *
 * @param  {?Object} children  Children object
 * @param  {String}  nodeName  Node name
 * @return {?Object}           The updated children object
 */
export function switchChildrenNodeName( children, nodeName ) {
	return children && Children.map( children, ( elt, index ) => {
		if ( isString( elt ) ) {
			return createElement( nodeName, { key: index }, elt );
		}
		const { children: childrenProp, ...props } = elt.props;
		return createElement( nodeName, { key: index, ...props }, childrenProp );
	} );
}
