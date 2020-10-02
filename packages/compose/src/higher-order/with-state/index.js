/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';

/**
 * A Higher Order Component used to provide and manage internal component state
 * via props.
 *
 * @template {Object} State
 * @template {Object} Props
 * @param {Partial<State>} [initialState={}] Optional initial state of the component.
 *
 * @return {ReturnType<import('../../types').MapComponentFunction<Props, State & { setState: React.Component['setState']}>>} Wrapped component.
 */
export default function withState( initialState = {} ) {
	/** @param {Component<Props & State>} OriginalComponent */
	const f = ( OriginalComponent ) => {
		return class WrappedComponent extends Component {
			/** @param {Props} props */
			constructor( props ) {
				super( props );

				/** @type {Component['setState']} */
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
		};
	};
	return createHigherOrderComponent( f, 'withState' );
}
