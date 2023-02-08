/**
 * Internal dependencies
 */
import { buildTermsTree } from './terms';
import TreeSelect from '../tree-select';
import type { TreeSelectProps } from '../tree-select/types';
import type { AuthorSelectProps } from './types';

export default function AuthorSelect( {
	label,
	noOptionLabel,
	authorList,
	selectedAuthorId,
	onChange: onChangeProp,
}: AuthorSelectProps ) {
	if ( ! authorList ) return null;
	const termsTree = buildTermsTree( authorList );
	return (
		<TreeSelect
			{ ...{
				label,
				noOptionLabel,
				// Since the `multiple` attribute is not passed to `TreeSelect`, it is
				// safe to assume that the argument of `onChange` cannot be `string[]`.
				// The correct solution would be to type `SelectControl` better, so that
				// the type of `value` and `onChange` vary depending on `multiple`.
				onChange: onChangeProp as TreeSelectProps[ 'onChange' ],
			} }
			tree={ termsTree }
			selectedId={
				selectedAuthorId !== undefined
					? String( selectedAuthorId )
					: undefined
			}
		/>
	);
}
