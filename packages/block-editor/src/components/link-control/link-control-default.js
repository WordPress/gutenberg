/**
 * Internal dependencies
 */
import LinkControlSettingsDrawer from './settings-drawer';
import LinkPreview from './link-preview';
import LinkControlEditControls from './link-control-edit-controls';
import LinkControlLoading from './link-control-loading';

export default function LinkControlDefault( props ) {
	const { renderControlBottom } = props;

	// Todo: share props without using context.
	return (
		<>
			<LinkControlLoading />

			<LinkControlEditControls { ...props } />

			<LinkPreview />

			<LinkControlSettingsDrawer />

			{ renderControlBottom && renderControlBottom() }
		</>
	);
}
