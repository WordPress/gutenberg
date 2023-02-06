/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../experiments';
import { store as editSiteStore } from '../../store';

const config = {
	wp_template: {
		path: '/templates/single',
		parentTitle: __( 'Templates' ),
		title: __( 'Template' ),
	},
	wp_template_part: {
		path: '/template-parts/single',
		parentTitle: __( 'Template parts' ),
		title: __( 'Template part' ),
	},
};

export default function SidebarNavigationScreenTemplate( {
	postType = 'wp_template',
	postId,
} ) {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );

	return (
		<SidebarNavigationScreen
			path={ config[ postType ].path }
			parentTitle={ config[ postType ].parentTitle }
			title={ config[ postType ].title }
			actions={
				<Button
					variant="primary"
					onClick={ () => setCanvasMode( 'edit' ) }
				>
					{ __( 'Edit' ) }
				</Button>
			}
		/>
	);
}
