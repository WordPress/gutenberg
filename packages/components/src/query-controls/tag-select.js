/**
 * Internal dependencies
 */
import { buildTermsTree } from './terms';
import TreeSelect from '../tree-select';

export default function TagSelect( { label, noOptionLabel, tagsList, selectedTagId, onChange } ) {
	const termsTree = buildTermsTree( tagsList );
	return (
		<TreeSelect
			{ ...{ label, noOptionLabel, onChange } }
			tree={ termsTree }
			selectedId={ selectedTagId }
		/>
	);
}
