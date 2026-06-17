/**
 * WordPress dependencies
 */
import type { Post } from '@wordpress/core-data';
import type { Field } from '@wordpress/dataviews';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

export const NAVIGATION_USAGE_FIELD = 'navigation-usage';

export function createUsageField( {
	statusMap,
	isResolving,
}: {
	statusMap: Record< number, number >;
	isResolving: boolean;
} ): Field< Post > {
	return {
		id: NAVIGATION_USAGE_FIELD,
		label: __( 'Usage' ),
		enableSorting: false,
		getValue: ( { item } ) => statusMap[ item.id ] ?? 0,
		render: function Render( { item } ) {
			if ( isResolving ) {
				return (
					<WCBadge intent="default">{ __( 'Checking…' ) }</WCBadge>
				);
			}

			const count = statusMap[ item.id ] ?? 0;

			if ( ! count ) {
				return <WCBadge intent="default">{ __( 'Inactive' ) }</WCBadge>;
			}

			return (
				<WCBadge intent="success">
					{ sprintf(
						/* translators: %d: Number of locations where this navigation menu is used. */
						_n( '%d location', '%d locations', count ),
						count
					) }
				</WCBadge>
			);
		},
	};
}
