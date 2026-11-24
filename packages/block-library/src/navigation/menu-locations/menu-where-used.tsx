import { useMemo } from '@wordpress/element';
import { useNavigationLocations } from './use-menu-locations';
import { getWhereUsedLabel } from './utils';

/**
 * Says where a menu is used, like "Used in 2 locations", or "Not used".
 *
 * @param props
 * @param props.navigationId The menu's ID.
 * @param props.className    Class name for the text.
 * @return The text, once the template parts have loaded.
 */
export default function MenuWhereUsed( {
	navigationId,
	className,
}: {
	navigationId: number | string;
	className?: string;
} ) {
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
