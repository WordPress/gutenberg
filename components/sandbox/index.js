/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ResizableIframe from 'components/resizable-iframe';

const Sandbox = React.createClass( {
	displayName: 'Sandbox',

	propTypes: {
		html: React.PropTypes.string,
	},

	getDefaultProps: function() {
		return {
			html: '',
		};
	},

	componentDidMount: function() {
		const body = this.node.getFrameBody();
		const { html } = this.props;

		body.innerHTML = html;

		// setting the inner HTML will not cause scripts to load,
		// so this prepares a bunch of new script elements and
		// appends them to the iframe's body
		const scripts = body.getElementsByTagName( 'script' );
		const newscripts = [];

		for ( let i = 0; i < scripts.length; i++ ) {
			const newscript = document.createElement( 'script' );
			newscript.src = scripts[ i ].src;
			newscripts.push( newscript );
		}

		for ( let i = 0; i < newscripts.length; i++ ) {
			body.appendChild( newscripts[ i ] );
		}
	},

	render: function() {
		return (
			<ResizableIframe
				sandbox="allow-same-origin allow-scripts"
				ref={ ( node ) => this.node = node } />
		);
	}
} );

export default Sandbox;
