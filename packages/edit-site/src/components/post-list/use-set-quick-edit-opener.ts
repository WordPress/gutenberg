import { useEvent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

interface Entities {
	postType: string;
	postIds: Array< number | string >;
}

/**
 * Sets how the posts list opens the quick edit form of posts, for the "Quick
 * edit" action of pages: it adds the posts to the URL, which shows the form
 * next to the list. Must be used inside the router.
 */
export default function useSetQuickEditOpener() {
	const history = useHistory();
	const { path, query } = useLocation();
	const { setQuickEditOpener } = unlock( useDispatch( editorStore ) );
	const openQuickEdit = useEvent( ( { postIds }: Entities ) => {
		history.navigate(
			addQueryArgs( path, {
				...query,
				quickEdit: true,
				postId: postIds.join( ',' ),
			} )
		);
	} );
	useEffect( () => {
		setQuickEditOpener( openQuickEdit );
		return () => setQuickEditOpener( undefined );
	}, [ setQuickEditOpener, openQuickEdit ] );
}
