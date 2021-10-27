/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

const navOptionPlaceholder = [
	{
		value: null,
		label: 'None',
	},
];

export default function NavigationAreaSelector() {
	const [ navigationArea, setNavigationArea ] = useState();

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
				areas.map( ( { slug, name } ) => {
					return {
						value: slug,
						label: name,
					};
				} )
			) }
			onChange={ ( { slug } ) => setNavigationArea( slug ) }
		/>
	);
}
