/**
 * Internal dependencies
 */
import { buildTermsTree } from './terms';
import TreeSelect from '../tree-select';
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
				onChange: onChangeProp,
			} }
			tree={ termsTree }
			selectedId={
				selectedAuthorId !== undefined
					? String( selectedAuthorId )
					: undefined
			}
			__nextHasNoMarginBottom
		/>
	);
}
