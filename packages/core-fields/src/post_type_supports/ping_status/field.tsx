import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import type { FieldsScriptParts } from '@wordpress/fields-loader';

interface PostWithPingStatus {
	ping_status?: 'open' | 'closed';
}

/**
 * The JavaScript parts of the pingbacks and trackbacks field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithPingStatus >[ string ] =
	{
		description: (
			<Link
				href={ __(
					'https://wordpress.org/documentation/article/trackbacks-and-pingbacks/'
				) }
				openInNewTab
			>
				{ __( 'Learn more about pingbacks & trackbacks' ) }
			</Link>
		),
		// The REST API stores the setting as `open` / `closed`; the field
		// exposes it as a boolean so the built-in checkbox control can edit
		// it.
		getValue: ( { item } ) => ( item.ping_status ?? 'open' ) === 'open',
		setValue: ( { value } ) => ( {
			ping_status: value ? 'open' : 'closed',
		} ),
		render: ( { item, field } ) =>
			field.getValue( { item } ) ? __( 'Allow' ) : __( "Don't allow" ),
	};
