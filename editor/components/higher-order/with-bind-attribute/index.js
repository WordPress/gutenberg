/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createHigherOrderComponent,
	Component,
	createElement,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../../block-edit/context';

/**
 * Higher-order component which augments a base component that is expected to
 * receive `value` and `onChange` props, augmenting the component to receive
 * a `bindAttribute` component where a string is passed to automatically handle
 * changes as setting attributes for the current block context.
 *
 * @param {WPComponent} WrappedComponent Original component.
 *
 * @return {WPComponent} Enhanced component.
 */
const withBindAttribute = createHigherOrderComponent(
	( WrappedComponent ) => {
		class EnhancedComponent extends Component {
			constructor() {
				super( ...arguments );

				this.setAttributes = this.setAttributes.bind( this );
			}

			setAttributes( nextValue ) {
				const { bindAttribute, setAttributes } = this.props;

				setAttributes( {
					[ bindAttribute ]: nextValue,
				} );
			}

			render() {
				return (
					<WrappedComponent
						{ ...omit( this.props, [
							'bindAttribute',
							'setAttributes',
						] ) }
						onChange={ this.setAttributes }
					/>
				);
			}
		}

		EnhancedComponent = withBlockEditContext( ( context, ownProps ) => {
			const { attributes, setAttributes } = context;
			const { bindAttribute } = ownProps;

			return {
				setAttributes: setAttributes,
				value: attributes[ bindAttribute ],
			};
		} )( EnhancedComponent );

		return ( props ) => {
			const isEnhanced = props.hasOwnProperty( 'bindAttribute' );
			const RenderedComponent = isEnhanced ? EnhancedComponent : WrappedComponent;

			return createElement( RenderedComponent, props );
		};
	},
	'withBindAttribute'
);

export default withBindAttribute;
