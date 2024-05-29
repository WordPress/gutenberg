/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

type Props = {
	node?: HTMLElement;
	[ key: string ]: any;
};

type State = {
	fallbackStyles?: { [ key: string ]: any };
	grabStylesCompleted: boolean;
};

export default (
	mapNodeToProps: (
		node: HTMLElement,
		props: Props
	) => { [ key: string ]: any }
) =>
	createHigherOrderComponent( ( WrappedComponent ) => {
		return class extends Component< Props, State > {
			nodeRef?: HTMLElement;

			constructor( props: Props ) {
				super( props );
				this.nodeRef = this.props.node;
				this.state = {
					fallbackStyles: undefined,
					grabStylesCompleted: false,
				};

				this.bindRef = this.bindRef.bind( this );
			}

			bindRef( node: HTMLDivElement ) {
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

			grabFallbackStyles() {
				const { grabStylesCompleted, fallbackStyles } = this.state;
				if ( this.nodeRef && ! grabStylesCompleted ) {
					const newFallbackStyles = mapNodeToProps(
						this.nodeRef,
						this.props
					);

					if (
						! fastDeepEqual( newFallbackStyles, fallbackStyles )
					) {
						this.setState( {
							fallbackStyles: newFallbackStyles,
							grabStylesCompleted:
								Object.values( newFallbackStyles ).every(
									Boolean
								),
						} );
					}
				}
			}

			render() {
				const wrappedComponent = (
					<WrappedComponent
						{ ...this.props }
						{ ...this.state.fallbackStyles }
					/>
				);
				return this.props.node ? (
					wrappedComponent
				) : (
					<div ref={ this.bindRef }> { wrappedComponent } </div>
				);
			}
		};
	}, 'withFallbackStyles' );
