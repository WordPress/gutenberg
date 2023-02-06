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
import useEditedEntityRecord from '../use-edited-entity-record';
import { unlock } from '../../experiments';
import { store as editSiteStore } from '../../store';

const config = {
	wp_template: {
		path: '/templates/single',
		parentTitle: __( 'Templates' ),
	},
	wp_template_part: {
		path: '/template-parts/single',
		parentTitle: __( 'Template parts' ),
	},
};

export default function SidebarNavigationScreenTemplate( {
	postType = 'wp_template',
} ) {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { getTitle } = useEditedEntityRecord();

	return (
		<SidebarNavigationScreen
			path={ config[ postType ].path }
			parentTitle={ config[ postType ].parentTitle }
			title={ getTitle() }
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
