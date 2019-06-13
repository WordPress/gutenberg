/**
 * Internal dependencies
 */
import { buildTermsTree } from './terms';
import TreeSelect from '../tree-select';

export default function AuthorSelect( { label, noOptionLabel, authorList, selectedAuthorId, onChange } ) {
	const termsTree = buildTermsTree( authorList );
	return (
		<TreeSelect
			{ ...{ label, noOptionLabel, onChange } }
			tree={ termsTree }
			selectedId={ selectedAuthorId }
		/>
	);
}
