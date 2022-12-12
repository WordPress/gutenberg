/**
 * Internal dependencies
 */
import LinkControlSettingsDrawer from './settings-drawer';
import LinkPreview from './link-preview';
import LinkControlEditControls from './link-control-edit-controls';
import LinkControlLoading from './link-control-loading';

export default function LinkControlDefault( {
	renderControlBottom,
	...editControlProps
} ) {
	// Todo: share props without using context.
	return (
		<>
			<LinkControlLoading />

			<LinkControlEditControls { ...editControlProps } />

			<LinkPreview />

			<LinkControlSettingsDrawer />

			{ renderControlBottom && renderControlBottom() }
		</>
	);
}
