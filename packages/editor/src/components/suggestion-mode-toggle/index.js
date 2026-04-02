/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const MODES = [
	{
		value: 'editing',
		label: __( 'Editing' ),
	},
	{
		value: 'suggesting',
		label: __( 'Suggesting' ),
	},
];

export default function SuggestionModeToggle() {
	const { objectType, objectId, mode, isCollaboration } = useSelect(
		( select ) => {
			const { getCurrentPostType, getCurrentPostId } =
				select( editorStore );
			const postType = getCurrentPostType();
			const postId = getCurrentPostId();
			const ot = `postType/${ postType }`;
			const { getSuggestionMode, isCollaborationSupported } = unlock(
				select( coreStore )
			);

			return {
				objectType: ot,
				objectId: String( postId ),
				mode: getSuggestionMode( ot, String( postId ) ),
				isCollaboration: isCollaborationSupported(),
			};
		},
		[]
	);

	const { setSuggestionMode } = unlock( useDispatch( coreStore ) );

	if ( ! isCollaboration ) {
		return null;
	}

	return (
		<MenuGroup label={ __( 'Editing mode' ) }>
			<MenuItemsChoice
				choices={ MODES }
				value={ mode }
				onSelect={ ( newMode ) =>
					setSuggestionMode( objectType, objectId, newMode )
				}
			/>
		</MenuGroup>
	);
}
