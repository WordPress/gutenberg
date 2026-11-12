import { useEvent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

interface Entity {
	postType: string;
	postId: number | string;
}

/**
 * Sets how the site editor opens an entity for editing, for the actions
 * opening one, such as the "Edit" action of pages: it navigates to the entity
 * with the editor canvas in edit mode. Must be used inside the router.
 */
export default function useSetEntityNavigator() {
	const history = useHistory();
	const { setEntityNavigator } = unlock( useDispatch( editorStore ) );
	const navigateToEntity = useEvent( ( { postType, postId }: Entity ) => {
		history.navigate( `/${ postType }/${ postId }?canvas=edit` );
	} );
	useEffect( () => {
		setEntityNavigator( navigateToEntity );
		return () => setEntityNavigator( undefined );
	}, [ setEntityNavigator, navigateToEntity ] );
}
