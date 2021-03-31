/**
 * WordPress dependencies
 */
import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const indicator = '\t•';
const unsavedChangesText = __( 'This change is unsaved' );
export default function UnsavedChangesIndicator( {
	children,
	hasUnsavedChanges = false,
} ) {
	return hasUnsavedChanges ? (
		<>
			<div className="dot-indicator">
				<Tooltip text={ unsavedChangesText }>
					<span className="dot">{ indicator }</span>
				</Tooltip>
			</div>

			{ children }
		</>
	) : (
		children
	);
}
