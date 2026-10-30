import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '../../../store';
import { managePatternsUrlKey } from '../../../store/private-keys';

/**
 * A link to the screen where patterns are managed (edited and deleted). The
 * editor provides the URL, so nothing renders when it isn't set.
 *
 * @return The link, or `null` without a URL.
 */
function ManagePatternsLink() {
	const managePatternsUrl = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()?.[
				managePatternsUrlKey
			] as string | undefined,
		[]
	);

	if ( ! managePatternsUrl ) {
		return null;
	}

	return (
		<Button
			__next40pxDefaultSize
			className="block-editor-inserter__patterns-manage-button"
			href={ managePatternsUrl }
			variant="tertiary"
		>
			{ __( 'Manage patterns' ) }
		</Button>
	);
}

export default ManagePatternsLink;
