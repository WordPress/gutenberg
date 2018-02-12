/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * A Higher Order Component used to be provide a unique instance ID by
 * component.
 *
 * @param {WPElement} WrappedComponent The wrapped component.
 *
 * @return {Component} Component with an instanceId prop.
 */
function withInstanceId( WrappedComponent ) {
	let instances = 0;

	return class extends Component {
		constructor() {
			super( ...arguments );
			this.instanceId = instances++;
		}

		render() {
			return (
				<WrappedComponent { ...this.props } instanceId={ this.instanceId } />
			);
		}
	};
}

export default withInstanceId;
