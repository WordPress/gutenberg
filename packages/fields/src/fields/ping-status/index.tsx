/**
 * WordPress dependencies
 */
import type { DataFormControlProps, Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { CheckboxControl, ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

function PingStatusEdit( {
	data,
	onChange,
}: DataFormControlProps< BasePost > ) {
	const pingStatus = data?.ping_status ?? 'open';

	const onTogglePingback = ( checked: boolean ) => {
		onChange( {
			...data,
			ping_status: checked ? 'open' : 'closed',
		} );
	};

	return (
		<CheckboxControl
			label={ __( 'Enable pingbacks & trackbacks' ) }
			checked={ pingStatus === 'open' }
			onChange={ onTogglePingback }
			help={
				<ExternalLink
					href={ __(
						'https://wordpress.org/documentation/article/trackbacks-and-pingbacks/'
					) }
				>
					{ __( 'Learn more about pingbacks & trackbacks' ) }
				</ExternalLink>
			}
		/>
	);
}

const pingStatusField: Field< BasePost > = {
	id: 'ping_status',
	label: __( 'Trackbacks & Pingbacks' ),
	type: 'text',
	Edit: PingStatusEdit,
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
	elements: [
		{
			value: 'open',
			label: __( 'Allow' ),
			description: __(
				'Allow link notifications from other blogs (pingbacks and trackbacks) on new articles.'
			),
		},
		{
			value: 'closed',
			label: __( "Don't allow" ),
			description: __(
				"Don't allow link notifications from other blogs (pingbacks and trackbacks) on new articles."
			),
		},
	],
};

/**
 * Ping status field for BasePost.
 */
export default pingStatusField;
