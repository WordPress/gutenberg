/**
 * WordPress dependencies
 */
import type { Post } from '@wordpress/core-data';
import type { Field } from '@wordpress/dataviews';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * Internal dependencies
 */
import {
	type NavigationLocationsMap,
	getLocationsSummary,
} from '../../navigation/use-navigation-locations';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

export const NAVIGATION_USAGE_FIELD = 'navigation-usage';

export function createLocationsField( {
	locationsMap,
	isResolving,
}: {
	locationsMap: NavigationLocationsMap;
	isResolving: boolean;
} ): Field< Post > {
	return {
		id: NAVIGATION_USAGE_FIELD,
		label: __( 'Shown on site' ),
		enableSorting: false,
		getValue: ( { item } ) =>
			getLocationsSummary( locationsMap[ item.id ] ?? [] ),
		render: function Render( { item } ) {
			if ( isResolving ) {
				return (
					<WCBadge intent="default">{ __( 'Checking…' ) }</WCBadge>
				);
			}

			const locations = locationsMap[ item.id ] ?? [];

			return locations.length ? (
				<WCBadge intent="success">
					{ getLocationsSummary( locations ) }
				</WCBadge>
			) : (
				<WCBadge intent="default">{ __( 'Not shown' ) }</WCBadge>
			);
		},
	};
}
