/**
 * External dependencies
 */
import { fireEvent, within } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import { waitForStoreResolvers } from './wait-for-store-resolvers';

/**
 * The inner block list renders its items via a FlatList component. In order to
 * actually render the items, a layout event is required to be triggered on this
 * component. Additionally, the call is wrapped over "waitForStoreResolvers" in
 * case any of the inner elements use selectors that are associated with store
 * resolvers.
 *
 * @param {import('react-test-renderer').ReactTestInstance} block           Block test instance to trigger layout event.
 * @param {Object}                                          [options]       Configuration options for the event.
 * @param {number}                                          [options.width] Width value to be passed to the event.
 */
export const triggerBlockListLayout = async ( block, { width = 320 } = {} ) =>
	waitForStoreResolvers( () =>
		fireEvent(
			within( block ).getByTestId( 'block-list-wrapper' ),
			'layout',
			{
				nativeEvent: {
					layout: {
						width,
					},
				},
			}
		)
	);
