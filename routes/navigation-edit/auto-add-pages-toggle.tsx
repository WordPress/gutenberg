import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { SwitchControl } from '@wordpress/ui';

const NAVIGATION_POST_TYPE = 'wp_navigation';
const META_KEY = 'wp_navigation_auto_add_pages';

type NavigationMenuRecord = {
	meta?: Record< string, unknown >;
};

/**
 * The menu's "Auto add pages" setting. A change is an edit to the menu record
 * and is saved with the screen's other changes.
 *
 * @param props
 * @param props.id The `wp_navigation` post ID.
 */
export default function AutoAddPagesToggle( { id }: { id: number } ) {
	const isEnabled = useSelect(
		( select ) => {
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				id
			) as NavigationMenuRecord | undefined;
			return !! record?.meta?.[ META_KEY ];
		},
		[ id ]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	const onCheckedChange = ( value: boolean ) => {
		editEntityRecord( 'postType', NAVIGATION_POST_TYPE, id, {
			meta: { [ META_KEY ]: value },
		} );
	};

	return (
		<SwitchControl
			label={ __( 'Auto add pages' ) }
			description={ __(
				'Automatically adds newly published pages to this navigation.'
			) }
			checked={ isEnabled }
			onCheckedChange={ onCheckedChange }
		/>
	);
}
