// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useAllowSwitchingTemplates } from './hooks';

export default function CreateNewTemplate( { onClick } ) {
	const { canCreateTemplates } = useSelect( ( select ) => {
		const { canUser } = select( coreStore );
		return {
			canCreateTemplates: canUser( 'create', {
				kind: 'postType',
				name: 'wp_template',
			} ),
		};
	}, [] );
	const allowSwitchingTemplate = useAllowSwitchingTemplates();

	// The default template in a post is indicated by an empty string.
	if ( ! canCreateTemplates || ! allowSwitchingTemplate ) {
		return null;
	}
	return (
		<Menu.Item onClick={ onClick }>
			<Menu.ItemLabel>{ __( 'Create new template' ) }</Menu.ItemLabel>
		</Menu.Item>
	);
}
