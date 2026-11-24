import convertComplementaryAreas from './convert-complementary-areas';
import convertEditorSettings from './convert-editor-settings';
import type { ScopedPreferences } from '../../types';

export default function convertPreferencesPackageData(
	data: ScopedPreferences
) {
	let newData = convertComplementaryAreas( data );
	newData = convertEditorSettings( newData );
	return newData;
}
