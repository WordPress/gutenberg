/**
 * WordPress dependencies
 */
import { InlineNotices, SnackbarNotices } from '@wordpress/notices';
import { createPortal } from '@wordpress/element';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { __experimentalGetOverlayLegacySlot: getOverlayLegacySlot } = unlock(
	componentsPrivateApis
);

function Notices() {
	return (
		<>
			<InlineNotices
				pinnedNoticesClassName="edit-widgets-notices__pinned"
				dismissibleNoticesClassName="edit-widgets-notices__dismissible"
			/>
			{ createPortal(
				<SnackbarNotices className="edit-widgets-notices__snackbar" />,
				getOverlayLegacySlot()
			) }
		</>
	);
}

export default Notices;
