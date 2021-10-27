/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

const navOptionPlaceholder = [
	{
		value: 0,
		label: 'None',
	},
];

export default function NavigationAreaSelector( props ) {
	const { navigationArea, onSelect } = props;
	const { areas, isRequesting } = useSelect( ( select ) => {
		const { getEntityRecords, isResolving } = select( coreStore );
		return {
			areas: getEntityRecords( 'taxonomy', 'wp_navigation_area' ),
			isRequesting: isResolving( 'getEntityRecords', [
				'taxonomy',
				'wp_navigation_area',
			] ),
		};
	}, [] );

	if ( isRequesting ) {
		return 'Loading Navigation Areas...';
	}

	if ( ! areas?.length ) {
		return null;
	}

	return (
		<SelectControl
			label="Navigation Area"
			value={ navigationArea }
			options={ navOptionPlaceholder.concat(
				areas.map( ( { id, name } ) => {
					return {
						value: id,
						label: name,
					};
				} )
			) }
			onChange={ ( areaId ) => {
				onSelect( Number( areaId ) );
			} }
		/>
	);
}
