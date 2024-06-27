/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

const PAGE_CONTENT_BLOCKS = [
	'core/post-content',
	'core/post-featured-image',
	'core/post-title',
];

export default function TemplateContentPanel() {
	const clientIds = useSelect( ( select ) => {
		const { getBlocksByName } = select( blockEditorStore );
		return getBlocksByName( PAGE_CONTENT_BLOCKS );
	}, [] );

	return (
		<PanelBody title={ __( 'Content' ) }>
			<BlockQuickNavigation clientIds={ clientIds } />
		</PanelBody>
	);
}
