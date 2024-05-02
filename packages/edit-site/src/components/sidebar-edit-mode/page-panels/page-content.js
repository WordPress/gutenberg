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
import { unlock } from '../../../lock-unlock';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

const PAGE_CONTENT_BLOCKS = [
	'core/post-content',
	'core/post-featured-image',
	'core/post-title',
];

export default function PageContent() {
	const clientIds = useSelect( ( select ) => {
		const { getBlocksByName } = select( blockEditorStore );
		return getBlocksByName( PAGE_CONTENT_BLOCKS );
	}, [] );
	return <BlockQuickNavigation clientIds={ clientIds } />;
}
