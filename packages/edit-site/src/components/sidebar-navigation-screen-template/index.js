/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { pencil } from '@wordpress/icons';
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import useEditedEntityRecord from '../use-edited-entity-record';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import { useAddedBy } from '../list/added-by';

function TemplateDescription( { template, getTitle } ) {
	const addedBy = useAddedBy( template.type, template.id );

	// Still loading for the metadata.
	if ( ! addedBy.text ) return null;

	const authorText = addedBy.isCustomized
		? sprintf(
				/* translators: %s: The author. Could be either the theme's name, plugin's name, or user's name. */
				__( '%s (customized)' ),
				addedBy.text
		  )
		: addedBy.text;

	if ( template.type === 'wp_template' && template.is_custom ) {
		return sprintf(
			/* translators: %s: The author. Could be either the theme's name, plugin's name, or user's name. */
			__(
				'This is a custom template that can be applied manually to any Post or Page, added by %s.'
			),
			authorText
		);
	} else if ( template.type === 'wp_template_part' ) {
		return sprintf(
			// translators: 1: template part title e.g: "Header". 2: The author. Could be either the theme's name, plugin's name, or user's name.
			__( 'This is your %1$s template part, added by %2$s' ),
			getTitle(),
			authorText
		);
	}

	return sprintf(
		/* translators: %s: The author. Could be either the theme's name, plugin's name, or user's name. */
		__( 'Added by %s.' ),
		authorText
	);
}

export default function SidebarNavigationScreenTemplate() {
	const { params } = useNavigator();
	const { postType, postId } = params;
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { getDescription, getTitle, record } = useEditedEntityRecord(
		postType,
		postId
	);
	const description = getDescription();

	return (
		<SidebarNavigationScreen
			title={ getTitle() }
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			description={
				description ||
				( !! record && (
					<TemplateDescription
						template={ record }
						getTitle={ getTitle }
					/>
				) )
			}
		/>
	);
}
