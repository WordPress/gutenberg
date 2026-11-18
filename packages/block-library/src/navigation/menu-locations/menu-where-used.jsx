import { useMemo } from '@wordpress/element';
import { useNavigationLocations } from './use-menu-locations';
import { getWhereUsedLabel } from './utils';

/**
 * Says where a menu is used, like "Used in Header, Footer", or "Not used".
 *
 * @param {Object} props
 * @param {number} props.navigationId The menu's ID.
 * @param {string} props.className    Class name for the text.
 * @return {?Element} The text, once the template parts have loaded.
 */
export default function MenuWhereUsed( { navigationId, className } ) {
	const { locations, isResolving } = useNavigationLocations();
	const label = useMemo(
		() =>
			getWhereUsedLabel(
				locations.filter( ( location ) =>
					location.menuIds.includes( Number( navigationId ) )
				)
			),
		[ locations, navigationId ]
	);

	if ( isResolving ) {
		return null;
	}

	return <span className={ className }>{ label }</span>;
}
