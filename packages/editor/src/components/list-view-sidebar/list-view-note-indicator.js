/**
 * WordPress dependencies
 */
import { Icon, comment } from '@wordpress/icons';
import { sprintf, _n } from '@wordpress/i18n';
import { VisuallyHidden, Tooltip } from '@wordpress/ui';

export default function ListViewNoteIndicator( { count } ) {
	if ( ! count ) {
		return null;
	}

	const label = sprintf(
		/* translators: %d: Number of unresolved notes. */
		_n( '%d unresolved note', '%d unresolved notes', count ),
		count
	);

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<span className="editor-list-view-sidebar__note-indicator">
						<Icon icon={ comment } />
						<VisuallyHidden>{ label }</VisuallyHidden>
					</span>
				}
			/>
			<Tooltip.Popup>{ label }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
