/**
 * External dependencies
 */
import { forOwn, kebabCase, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';

const mapAttributeName = ( name ) => {
	if ( 'className' === name ) {
		return 'class';
	}
	return kebabCase( name );
};

class CustomElement extends Component {
	constructor() {
		super( ...arguments );

		this.ref = createRef();
	}

	componentDidMount() {
		this.setCustomElementProps( this.props );
	}

	componentDidUpdate() {
		this.setCustomElementProps( this.props );
	}

	setCustomElementProps( props ) {
		const { tagName, attributes, ...properties } = props;

		let child = this.ref.current.firstChild;
		if ( ! child ) {
			child = document.createElement( tagName );
			this.ref.current.appendChild( child );
		}

		// Ensure class names are passed as attribute.
		if ( properties.className ) {
			attributes.className = uniq( [
				...properties.className.split( ' ' ),
				...( attributes.className || '' ).split( ' ' ),
			] ).join( ' ' );
			delete properties.className;
		}

		forOwn( properties, ( value, key ) => {
			child[ key ] = value;
		} );

		forOwn( attributes, ( value, key ) => {
			key = mapAttributeName( key );
			child.setAttribute( key, value );
		} );
	}

	render() {
		return <div ref={ this.ref } />;
	}
}

export default CustomElement;
