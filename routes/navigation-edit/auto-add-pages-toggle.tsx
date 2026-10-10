import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { SwitchControl } from '@wordpress/ui';

const NAVIGATION_POST_TYPE = 'wp_navigation';
const META_KEY = 'wp_navigation_auto_add_pages';

type NavigationMenuMeta = Record< string, unknown > & {
	[ META_KEY ]?: boolean;
};

/**
 * The menu's "Auto add pages" setting. Like the menu's items, a change is an
 * edit to the `wp_navigation` record and is saved from the Save button.
 *
 * @param props
 * @param props.id The `wp_navigation` post ID.
 */
export default function AutoAddPagesToggle( { id }: { id: number } ) {
	const [ meta, setMeta ] = useEntityProp(
		'postType',
		NAVIGATION_POST_TYPE,
		'meta',
		id
	) as unknown as [
		NavigationMenuMeta | undefined,
		( meta: NavigationMenuMeta ) => void,
	];

	return (
		<SwitchControl
			label={ __( 'Auto add pages' ) }
			description={ __(
				'Add a link to each new top-level page when it is published.'
			) }
			checked={ !! meta?.[ META_KEY ] }
			onCheckedChange={ ( value: boolean ) =>
				setMeta( { ...meta, [ META_KEY ]: value } )
			}
		/>
	);
}
