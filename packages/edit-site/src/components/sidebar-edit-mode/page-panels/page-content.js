/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { CONTENT_BLOCK_TYPES } from '../../page-content-lock/constants';
import { unlock } from '../../../private-apis';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

export default function PageContent() {
	const pageContentClientIds = useSelect( ( select ) => {
		const { getClientIdsWithDescendants, getBlockName } =
			select( blockEditorStore );
		return getClientIdsWithDescendants().filter( ( clientId ) =>
			CONTENT_BLOCK_TYPES.includes( getBlockName( clientId ) )
		);
	}, [] );
	return <BlockQuickNavigation clientIds={ pageContentClientIds } />;
}
