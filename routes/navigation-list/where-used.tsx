import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';
import type { Post } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';

export const WHERE_USED_FIELD_ID = 'where_used';

function getBlockLibraryPrivateApis() {
	const privateApis = ( window as any ).wp?.blockLibrary?.privateApis;
	return privateApis ? unlock( privateApis ) : null;
}

/**
 * Block-library's private APIs, once the lazily loaded editor assets have
 * brought it in, and only while the Navigation menu editing experiment is
 * on. Neither is known when this route first renders, so this checks until
 * they are.
 *
 * @return The private APIs, or null.
 */
export function useMenuLocationsApis() {
	const [ apis, setApis ] = useState( getBlockLibraryPrivateApis );

	useEffect( () => {
		if ( apis ) {
			return;
		}
		const interval = setInterval( () => {
			const found = getBlockLibraryPrivateApis();
			if ( found ) {
				setApis( found );
				clearInterval( interval );
			}
		}, 500 );
		return () => clearInterval( interval );
	}, [ apis ] );

	return apis && ( window as any ).__experimentalNavigationMenuEditing
		? apis
		: null;
}

/**
 * A field saying where each menu is used, like "Used in Header, Footer", or
 * "Not used".
 *
 * @param apis Block-library's private APIs.
 * @return The field.
 */
export function getWhereUsedField( apis: any ): Field< Post > {
	const { MenuWhereUsed } = apis;

	return {
		id: WHERE_USED_FIELD_ID,
		label: __( 'Where used' ),
		enableSorting: false,
		enableHiding: false,
		render: ( { item } ) => <MenuWhereUsed navigationId={ item.id } />,
	};
}
