/**
 * External dependencies
 */
import { every, isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import isShallowEqual from '@wordpress/is-shallow-equal';

export default ( mapNodeToProps, computeWhenChange ) => createHigherOrderComponent(
	( WrappedComponent ) => {
		return class extends Component {
			constructor() {
				super( ...arguments );
				this.nodeRef = this.props.node;
				this.state = {
					fallbackStyles: undefined,
					grabStylesCompleted: false,
				};
				this.shouldRecomputeValues = this.shouldRecomputeValues().bind( this );

				this.bindRef = this.bindRef.bind( this );
			}

			bindRef( node ) {
				if ( ! node ) {
					return;
				}
				this.nodeRef = node;
			}

			componentDidMount() {
				this.grabFallbackStyles();
			}

			componentDidUpdate() {
				this.grabFallbackStyles();
			}

			shouldRecomputeValues() {
				let lastRecomputeValues = [];
				return () => {
					if ( ! computeWhenChange ) {
						return ! this.state.grabStylesCompleted;
					}
					const newRecomputeValues = computeWhenChange( this.props );
					if ( isShallowEqual( lastRecomputeValues, newRecomputeValues ) ) {
						return false;
					}
					lastRecomputeValues = newRecomputeValues;
					return true;
				};
			}

			grabFallbackStyles() {
				const { fallbackStyles } = this.state;
				if ( this.nodeRef && this.shouldRecomputeValues() ) {
					const newFallbackStyles = mapNodeToProps( this.nodeRef, this.props );
					if ( ! isEqual( newFallbackStyles, fallbackStyles ) ) {
						this.setState( {
							fallbackStyles: newFallbackStyles,
							grabStylesCompleted: !! every( newFallbackStyles ),
						} );
					}
				}
			}

			render() {
				const wrappedComponent = <WrappedComponent { ...this.props } { ...this.state.fallbackStyles } />;
				return this.props.node ? wrappedComponent : <div ref={ this.bindRef }> { wrappedComponent } </div>;
			}
		};
	},
	'withFallbackStyles'
);
