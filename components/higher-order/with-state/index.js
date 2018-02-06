/**
 * WordPress dependencies
 */
import { Component, getWrapperDisplayName } from '@wordpress/element';

/**
 * A Higher Order Component used to provide and manage internal component state
 * via props.
 *
 * @param {?Object} initialState Optional initial state of the component.
 *
 * @return {Component} Wrapped component.
 */
function withState( initialState = {} ) {
	return ( OriginalComponent ) => {
		class WrappedComponent extends Component {
			constructor() {
				super( ...arguments );

				this.setState = this.setState.bind( this );

				this.state = initialState;
			}

			render() {
				return (
					<OriginalComponent
						{ ...this.props }
						{ ...this.state }
						setState={ this.setState }
					/>
				);
			}
		}

		WrappedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'state' );

		return WrappedComponent;
	};
}

export default withState;
