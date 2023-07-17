/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLink } from '../routes/link';

export default function TemplatePartNavigationMenuListItem( { id } ) {
	const title = useSelect( ( select ) => {
		const { getEditedEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } =
			select( editorStore );

		const _record = getEditedEntityRecord(
			'postType',
			'wp_navigation',
			id
		);

		const templateInfo = getTemplateInfo( _record );
		return templateInfo?.title || __( '(no title)' );
	} );

	const linkInfo = useLink( {
		postId: id,
		postType: 'wp_navigation',
	} );

	if ( ! id ) return null;

	return (
		<SidebarNavigationItem withChevron { ...linkInfo }>
			{ title }
		</SidebarNavigationItem>
	);
}
