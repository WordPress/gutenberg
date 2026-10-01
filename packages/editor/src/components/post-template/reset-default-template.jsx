// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	useAllowSwitchingTemplates,
	useCurrentTemplateSlug,
	useEditedPostContext,
} from './hooks';

export default function ResetDefaultTemplate() {
	const currentTemplateSlug = useCurrentTemplateSlug();
	const allowSwitchingTemplate = useAllowSwitchingTemplates();
	const { postType, postId } = useEditedPostContext();
	const { editEntityRecord } = useDispatch( coreStore );
	// The default template in a post is indicated by an empty string.
	if ( ! currentTemplateSlug || ! allowSwitchingTemplate ) {
		return null;
	}
	return (
		<Menu.Item
			onClick={ () => {
				editEntityRecord(
					'postType',
					postType,
					postId,
					{ template: '' },
					{ undoIgnore: true }
				);
			} }
		>
			<Menu.ItemLabel>{ __( 'Use default template' ) }</Menu.ItemLabel>
		</Menu.Item>
	);
}
