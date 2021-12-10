/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { useLocation } from '../routes';
import Editor from '../editor';
import List from '../list';
import getIsListPage from '../../utils/get-is-list-page';

export default function EditSiteApp( { reboot } ) {
	const { params } = useLocation();
	const {
		isInserterOpen,
		isListViewOpen,
		sidebarIsOpened,
		postType,
	} = useSelect(
		( select ) => {
			const { isInserterOpened, isListViewOpened } = select(
				editSiteStore
			);

			// The currently selected entity to display. Typically template or template part.
			return {
				isInserterOpen: isInserterOpened(),
				isListViewOpen: isListViewOpened(),
				sidebarIsOpened: !! select(
					interfaceStore
				).getActiveComplementaryArea( editSiteStore.name ),
				postType: select( coreStore ).getPostType( params.postType ),
			};
		},
		[ params.postType ]
	);

	const isListPage = getIsListPage( params );

	return isListPage
		? List.renderLayout( {
				postType,
				activeTemplateType: params.postType,
		  } )
		: Editor.renderLayout( {
				isInserterOpen,
				isListViewOpen,
				sidebarIsOpened,
				reboot,
		  } );
}
