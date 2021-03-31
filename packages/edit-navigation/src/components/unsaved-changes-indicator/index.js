/**
 * WordPress dependencies
 */
import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const unsavedChangesText = __( 'This change is unsaved' );
export default function UnsavedChangesIndicator( {
	children,
	hasUnsavedChanges = false,
} ) {
	return hasUnsavedChanges ? (
		<>
			<div className="dot-indicator">
				<Tooltip text={ unsavedChangesText }>
					<span className="dot" />
				</Tooltip>
			</div>

			{ children }
		</>
	) : (
		children
	);
}
