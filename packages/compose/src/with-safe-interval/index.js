/**
 * External dependencies
 */
import { without } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../create-higher-order-component';

/**
 * A higher-order component used to provide and manage interval-based function
 * calls that ought to be bound to a component's lifecycle.
 *
 * @param {Component} OriginalComponent Component requiring setInterval
 *
 * @return {Component}                  Wrapped component.
 */
const withSafeInterval = createHigherOrderComponent(
	( OriginalComponent ) => {
		return class WrappedComponent extends Component {
			constructor() {
				super( ...arguments );
				this.intervals = [];
				this.setInterval = this.setInterval.bind( this );
				this.clearInterval = this.clearInterval.bind( this );
			}

			componentWillUnmount() {
				this.intervals.forEach( clearInterval );
			}

			setInterval( fn, delay ) {
				const id = setInterval( fn, delay );
				this.intervals.push( id );
				return id;
			}

			clearInterval( id ) {
				clearInterval( id );
				this.intervals = without( this.intervals, id );
			}

			render() {
				return (
					<OriginalComponent
						{ ...this.props }
						setInterval={ this.setInterval }
						clearInterval={ this.clearInterval }
					/>
				);
			}
		};
	},
	'withSafeInterval'
);

export default withSafeInterval;
