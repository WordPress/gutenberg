/**
 * WordPress dependencies
 */
import isShallowEqual from '@wordpress/is-shallow-equal';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';

/**
 * Given a component returns the enhanced component augmented with a component
 * only rerendering when its props/state change
 *
 * @type {import('../../utils/create-higher-order-component').HigherOrderComponent<{}>}
 */
const pure = createHigherOrderComponent(
	/**
	 * @template TProps
	 * @param {import('react').ComponentType<TProps>} Wrapped
	 */
	( Wrapped ) => {
		if ( Wrapped.prototype instanceof Component ) {
			// casting inline requires fighting prettier so this separating it onto a separate line makes more sense
			/* eslint-disable jsdoc/no-undefined-types */
			const WrappedComponent = /** @type {import('react').ComponentClass<TProps>} */ ( Wrapped );
			return class extends WrappedComponent {
				/**
				 * @param {TProps} nextProps
				 * @param {any} nextState
				 */
				/* eslint-enable jsdoc/no-undefined-types */
				shouldComponentUpdate( nextProps, nextState ) {
					return (
						! isShallowEqual( nextProps, this.props ) ||
						! isShallowEqual( nextState, this.state )
					);
				}
			};
		}

		return class extends Component {
			/**
			 * @param {TProps} nextProps
			 */
			shouldComponentUpdate( nextProps ) {
				return ! isShallowEqual( nextProps, this.props );
			}

			render() {
				// cast is required: https://github.com/microsoft/TypeScript/issues/28938
				/** @type {TProps} */
				const props = this.props;
				return <Wrapped { ...props } />;
			}
		};
	},
	'pure'
);

export default pure;
