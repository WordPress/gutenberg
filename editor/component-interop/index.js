/**
 * External dependencies
 */
import { isString, includes, forOwn } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

function isWebComponent( tagName ) {
	return isString( tagName ) && includes( tagName, '-' );
}

class ComponentInterop extends Component {
	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
	}

	componentDidMount() {
		this.setWebComponentProps( this.props );
	}

	componentWillReceiveProps( nextProps ) {
		this.setWebComponentProps( nextProps );
	}

	setWebComponentProps( props ) {
		const { tagName, attributes, ...properties } = props;
		if ( ! isWebComponent( tagName ) ) {
			return;
		}

		let child = this.node.firstChild;
		if ( ! child ) {
			child = document.createElement( tagName );
			this.node.appendChild( child );
		}

		forOwn( properties, ( value, key ) => {
			child[ key ] = value;
		} );

		forOwn( attributes, ( value, key ) => {
			child.setAttribute( key, value );
		} );
	}

	shouldComponentUpdate() {
		const { tagName } = this.props;
		if ( isWebComponent( tagName ) ) {
			return false;
		}

		if ( 'function' === typeof tagName &&
				'function' === typeof tagName.prototype.shouldComponentUpdate ) {
			return tagName.prototype.shouldComponentUpdate.apply( this, arguments );
		}

		return true;
	}

	bindNode( node ) {
		this.node = node;
	}

	render() {
		const { tagName: TagName, ...componentProps } = this.props;
		if ( isWebComponent( TagName ) ) {
			return <div ref={ this.bindNode } />;
		}

		return <TagName { ...componentProps } />;
	}
}

export default ComponentInterop;
