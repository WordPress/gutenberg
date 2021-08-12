/**
 * WordPress dependencies
 */
import { Fill } from '@wordpress/components';

function UnsavedChangesIndicator() {
	return <div className="block-unsaved-changes-indicator"></div>;
}

function SelectedBlockUnsavedChangesIndicator() {
	return (
		<>
			<Fill name="block-unsaved-changes-indicator">
				<UnsavedChangesIndicator />
			</Fill>
		</>
	);
}

export default SelectedBlockUnsavedChangesIndicator;
