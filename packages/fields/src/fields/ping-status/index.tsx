import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import type { BasePost } from '../../types';

const pingStatusField: Field< BasePost > = {
	id: 'ping_status',
	label: __( 'Enable pingbacks & trackbacks' ),
	header: __( 'Trackbacks & Pingbacks' ),
	type: 'boolean',
	description: (
		<ExternalLink
			href={ __(
				'https://wordpress.org/documentation/article/trackbacks-and-pingbacks/'
			) }
		>
			{ __( 'Learn more about pingbacks & trackbacks' ) }
		</ExternalLink>
	),
	// The REST API stores the setting as `open` / `closed`; the field
	// exposes it as a boolean so the built-in checkbox control can edit it.
	getValue: ( { item } ) => ( item.ping_status ?? 'open' ) === 'open',
	setValue: ( { value } ) => ( {
		ping_status: value ? 'open' : 'closed',
	} ),
	render: ( { item, field } ) =>
		field.getValue( { item } ) ? __( 'Allow' ) : __( "Don't allow" ),
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
};

/**
 * Ping status field for BasePost.
 */
export default pingStatusField;
