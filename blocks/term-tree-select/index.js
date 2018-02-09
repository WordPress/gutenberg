/**
 * External dependencies
 */
import { unescape as unescapeString, repeat, flatMap, compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';

function getSelectOptions( terms, level = 0 ) {
	return flatMap( terms, ( term ) => [
		{
			value: term.id,
			label: repeat( '\u00A0', level * 3 ) + unescapeString( term.name ),
		},
		...getSelectOptions( term.children, level + 1 ),
	] );
}

export default function TermTreeSelect( { termsTree, label, noOptionLabel, selectedTerm, onChange } ) {
	const options = compact( [
		noOptionLabel && { value: '', label: noOptionLabel },
		...getSelectOptions( termsTree ),
	] );
	return (
		<SelectControl
			{ ...{ label, options, onChange } }
			value={ selectedTerm }
		/>
	);
}
