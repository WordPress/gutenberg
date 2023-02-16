/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Button,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';

export default function SidebarNavigationScreenNavigationItem() {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const {
		params: { postType, postId },
	} = useNavigator();

	const { post } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );

			// The currently selected entity to display.
			// Typically template or template part in the site editor.
			return {
				post:
					postId && postType
						? getEntityRecord( 'postType', postType, postId )
						: null,
			};
		},
		[ postType, postId ]
	);

	return (
		<SidebarNavigationScreen
			title={ post ? decodeEntities( post?.title?.rendered ) : null }
			actions={
				<Button
					variant="primary"
					onClick={ () => setCanvasMode( 'edit' ) }
				>
					{ __( 'Edit' ) }
				</Button>
			}
			content={
				post ? decodeEntities( post?.description?.rendered ) : null
			}
		/>
	);
}
