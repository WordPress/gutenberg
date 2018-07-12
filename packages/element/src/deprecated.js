/**
 * External dependencies
 */
import { flowRight } from 'lodash';
import { Component } from 'react';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from './create-higher-order-component';

export const compose = ( ...args ) => {
	deprecated( 'wp.element.compose', {
		version: '3.5',
		alternative: 'wp.compose.compose',
	} );

	return flowRight( ...args );
};

export const pure = createHigherOrderComponent( ( Wrapped ) => {
	deprecated( 'wp.element.pure', {
		version: '3.5',
		alternative: 'wp.compose.pure',
	} );

	if ( Wrapped.prototype instanceof Component ) {
		return class extends Wrapped {
			shouldComponentUpdate( nextProps, nextState ) {
				return ! isShallowEqual( nextProps, this.props ) || ! isShallowEqual( nextState, this.state );
			}
		};
	}

	return class extends Component {
		shouldComponentUpdate( nextProps ) {
			return ! isShallowEqual( nextProps, this.props );
		}

		render() {
			return <Wrapped { ...this.props } />;
		}
	};
}, 'pure' );
