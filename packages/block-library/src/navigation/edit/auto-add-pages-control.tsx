import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { SwitchControl } from '@wordpress/ui';

const META_KEY = 'wp_navigation_auto_add_pages';

type NavigationMenuRecord = {
	meta?: Record< string, unknown >;
};

type Props = {
	/** The `wp_navigation` post the block displays. */
	menuId: number;
};

/**
 * The menu's "Auto add pages" setting.
 *
 * It belongs to the Navigation Menu rather than to the block, so a change is
 * an edit to the menu record and is saved along with the block's other menu
 * edits. It renders nothing for a user who cannot update the menu.
 *
 * @param props
 * @param props.menuId
 */
export default function AutoAddPagesControl( { menuId }: Props ) {
	const { canUpdate, isEnabled } = useSelect(
		( select ) => {
			const { canUser, getEditedEntityRecord } = select( coreStore );
			const record = getEditedEntityRecord(
				'postType',
				'wp_navigation',
				menuId
			) as NavigationMenuRecord | undefined;
			return {
				canUpdate: !! canUser( 'update', {
					kind: 'postType',
					name: 'wp_navigation',
					id: menuId,
				} ),
				isEnabled: !! record?.meta?.[ META_KEY ],
			};
		},
		[ menuId ]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	if ( ! canUpdate ) {
		return null;
	}

	const setEnabled = ( value: boolean ) => {
		editEntityRecord( 'postType', 'wp_navigation', menuId, {
			meta: { [ META_KEY ]: value },
		} );
	};

	return (
		<div className="wp-block-navigation__auto-add-pages">
			<SwitchControl
				label={ __( 'Auto add pages' ) }
				description={ __(
					'Add a link to each new page when it is published. A child page is added under the link to its parent.'
				) }
				checked={ isEnabled }
				onCheckedChange={ setEnabled }
			/>
		</div>
	);
}
