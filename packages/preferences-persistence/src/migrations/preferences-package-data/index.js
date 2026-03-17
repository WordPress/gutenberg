/**
 * Internal dependencies
 */
import convertComplementaryAreas from './convert-complementary-areas';
import convertEditorSettings from './convert-editor-settings';

export default function convertPreferencesPackageData( data ) {
	let newData = convertComplementaryAreas( data );
	newData = convertEditorSettings( newData );
	return newData;
}
