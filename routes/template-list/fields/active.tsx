/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

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
			<Badge intent={ isActive ? activeIntent : 'default' }>
				{ isActive ? activeLabel : _x( 'Inactive', 'template' ) }
			</Badge>
		);
	},
};
