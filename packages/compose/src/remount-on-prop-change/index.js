/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../create-higher-order-component';

/**
 * Higher-order component creator, creating a new component that remounts
 * the wrapped component each time a given prop value changes.
 *
 * @param {string} propName Prop name to monitor.
 *
 * @return {Function} Higher-order component.
 */
const remountOnPropChange = ( propName ) => createHigherOrderComponent( ( WrappedComponent ) => {
	deprecated( 'remountOnPropChange', {
		plugin: 'Gutenberg',
		version: '4.4.0',
	} );

	return class extends Component {
		constructor( props ) {
			super( ...arguments );
			this.state = {
				propChangeId: 0,
				propValue: props[ propName ],
			};
		}

		static getDerivedStateFromProps( props, state ) {
			if ( props[ propName ] === state.propValue ) {
				return null;
			}

			return {
				propChangeId: state.propChangeId + 1,
				propValue: props[ propName ],
			};
		}

		render() {
			return <WrappedComponent key={ this.state.propChangeId } { ...this.props } />;
		}
	};
}, 'remountOnPropChange' );

export default remountOnPropChange;
