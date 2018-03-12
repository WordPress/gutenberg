/**
 * WordPress dependencies
 */
import { Component, compose, renderToString } from '@wordpress/element';

export class ServerSideRender extends Component {
	render() {
		return (
			<div>Here will be SSR!</div>
		);
	}
}

export default ServerSideRender;