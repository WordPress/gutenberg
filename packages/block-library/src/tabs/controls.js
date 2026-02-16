/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab/remove-tab-toolbar-control';

export default function Controls( { clientId } ) {
	return (
		<>
			<AddTabToolbarControl tabsClientId={ clientId } />
			<RemoveTabToolbarControl tabsClientId={ clientId } />
		</>
	);
}
