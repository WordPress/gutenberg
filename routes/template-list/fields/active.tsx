/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '@wordpress/routes-lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

export const activeField = {
	label: __( 'Status' ),
	id: 'active',
	type: 'boolean',
	getValue: ( { item }: { item: any } ) => item._isActive,
	render: function Render( { item }: { item: any } ) {
		const activeLabel = item._isCustom
			? _x( 'Active when used', 'template' )
			: _x( 'Active', 'template' );
		const activeIntent = item._isCustom ? 'info' : 'success';
		const isActive = item._isActive;
		return (
			<WCBadge intent={ isActive ? activeIntent : 'default' }>
				{ isActive ? activeLabel : _x( 'Inactive', 'template' ) }
			</WCBadge>
		);
	},
};
