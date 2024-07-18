/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, pure } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useSelect from '../use-select';

/** @typedef {import('react').ComponentType} ComponentType */

/**
 * Higher-order component used to inject state-derived props using registered
 * selectors.
 *
 * @param {Function} mapSelectToProps Function called on every state change,
 *                                    expected to return object of props to
 *                                    merge with the component's own props.
 *
 * @example
 * ```js
 * import { withSelect } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * function PriceDisplay( { price, currency } ) {
 * 	return new Intl.NumberFormat( 'en-US', {
 * 		style: 'currency',
 * 		currency,
 * 	} ).format( price );
 * }
 *
 * const HammerPriceDisplay = withSelect( ( select, ownProps ) => {
 * 	const { getPrice } = select( myCustomStore );
 * 	const { currency } = ownProps;
 *
 * 	return {
 * 		price: getPrice( 'hammer', currency ),
 * 	};
 * } )( PriceDisplay );
 *
 * // Rendered in the application:
 * //
 * //  <HammerPriceDisplay currency="USD" />
 * ```
 * In the above example, when `HammerPriceDisplay` is rendered into an
 * application, it will pass the price into the underlying `PriceDisplay`
 * component and update automatically if the price of a hammer ever changes in
 * the store.
 *
 * @return {ComponentType} Enhanced component with merged state data props.
 */
const withSelect = ( mapSelectToProps ) =>
	createHigherOrderComponent(
		( WrappedComponent ) =>
			pure( ( ownProps ) => {
				const mapSelect = ( select, registry ) =>
					mapSelectToProps( select, ownProps, registry );
				const mergeProps = useSelect( mapSelect );
				return <WrappedComponent { ...ownProps } { ...mergeProps } />;
			} ),
		'withSelect'
	);

export default withSelect;
