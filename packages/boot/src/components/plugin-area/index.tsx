/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { PluginArea as WPPluginArea } from '@wordpress/plugins';

export default function PluginArea() {
	const { createErrorNotice } = useDispatch( noticesStore );

	return (
		<WPPluginArea
			onError={ ( name ) => {
				createErrorNotice(
					sprintf(
						/* translators: %s: plugin name */
						__(
							'The "%s" plugin has encountered an error and cannot be rendered.'
						),
						name
					)
				);
			} }
		/>
	);
}
