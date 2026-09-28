import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { PluginArea as WPPluginArea } from '@wordpress/plugins';

/**
 * Mounts every plugin registered with `registerPlugin`, so the fills they
 * render reach their slots.
 *
 * Sits at the root rather than with the editor: a plugin's fills mostly target
 * editor slots, but the component holding them is also where it registers
 * commands and extends a list, which the routes without a canvas need too.
 *
 * @return The mount point. Renders whatever the plugins do, and nothing itself.
 */
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
