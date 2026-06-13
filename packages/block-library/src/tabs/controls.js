/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab-panel/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab-panel/remove-tab-toolbar-control';

export default function Controls( { clientId } ) {
	return (
		<>
			<AddTabToolbarControl tabsClientId={ clientId } />
			<RemoveTabToolbarControl tabsClientId={ clientId } />
		</>
	);
}
