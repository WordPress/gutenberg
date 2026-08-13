import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Warning shown at the top of a styles panel while the block holds a value
 * whose control is disabled in the theme settings. Such values render as a
 * read-only row with a Reset button, and this notice explains why they
 * cannot be edited.
 *
 * @return {Element} The notice, spanning the full tools panel grid.
 */
export default function DisabledControlsNotice() {
	return (
		// Full-width cell; a plain child would flow into the tools panel
		// grid as a half-width item.
		<div style={ { gridColumn: '1 / -1' } }>
			<Notice status="warning" isDismissible={ false }>
				{ __(
					'Some controls are disabled in this theme. Values applied earlier can be reset, but not changed.'
				) }
			</Notice>
		</div>
	);
}
