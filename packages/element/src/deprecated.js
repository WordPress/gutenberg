/**
 * External dependencies
 */
import { flowRight, upperFirst, camelCase } from 'lodash';
import { Component } from 'react';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import isShallowEqual from '@wordpress/is-shallow-equal';

export function createHigherOrderComponent( mapComponentToEnhancedComponent, modifierName ) {
	deprecated( 'wp.element.createHigherOrderComponent', {
		version: '3.5',
		alternative: 'wp.compose.createHigherOrderComponent',
	} );

	return ( OriginalComponent ) => {
		const EnhancedComponent = mapComponentToEnhancedComponent( OriginalComponent );
		const { displayName = OriginalComponent.name || 'Component' } = OriginalComponent;
		EnhancedComponent.displayName = `${ upperFirst( camelCase( modifierName ) ) }(${ displayName })`;

		return EnhancedComponent;
	};
}

export const compose = ( ...args ) => {
	deprecated( 'wp.element.compose', {
		version: '3.5',
		alternative: 'wp.compose.compose',
	} );

	return flowRight( ...args );
};

export const pure = ( Wrapped ) => {
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
};
