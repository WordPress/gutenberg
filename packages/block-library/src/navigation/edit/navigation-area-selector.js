/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';

const navOptionPlaceholder = [
	{
		value: 0,
		label: 'None',
	},
];

export default function NavigationAreaSelector( props ) {
	const {
		navigationAreaId,
		navigationAreas,
		isRequestingAreas,
		onSelect,
	} = props;

	if ( isRequestingAreas ) {
		return 'Loading Navigation Areas...';
	}

	if ( ! navigationAreas?.length ) {
		return null;
	}

	return (
		<SelectControl
			label="Navigation Area"
			value={ navigationAreaId }
			options={ navOptionPlaceholder.concat(
				navigationAreas.map( ( { id, name } ) => {
					return {
						value: id,
						label: name,
					};
				} )
			) }
			onChange={ ( value ) => {
				onSelect( Number( value ) );
			} }
		/>
	);
}
