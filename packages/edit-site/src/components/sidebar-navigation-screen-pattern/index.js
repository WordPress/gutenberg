/**
 * WordPress dependencies
 */
import { __, sprintf, _x } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { pencil } from '@wordpress/icons';
import {
	__experimentalUseNavigator as useNavigator,
	Icon,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import useEditedEntityRecord from '../use-edited-entity-record';
import useInitEditedEntityFromURL from '../sync-state-with-url/use-init-edited-entity-from-url';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import { useAddedBy } from '../list/added-by';

function usePatternTitleAndDescription( postType, postId ) {
	const { getDescription, getTitle, record } = useEditedEntityRecord(
		postType,
		postId
	);
	const currentTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme(),
		[]
	);
	const addedBy = useAddedBy( postType, postId );
	const isAddedByActiveTheme =
		addedBy.type === 'theme' && record.theme === currentTheme?.stylesheet;
	const title = getTitle();
	let descriptionText = getDescription();

	if ( ! descriptionText && addedBy.text ) {
		descriptionText = sprintf(
			// translators: %s: pattern title e.g: "Header".
			__( 'This is your %s pattern.' ),
			getTitle()
		);
	}

	if ( ! descriptionText && postType === 'wp_block' && record?.title ) {
		descriptionText = sprintf(
			// translators: %s: user created pattern title e.g. "Footer".
			__( 'This is your %s pattern.' ),
			record.title
		);
	}

	const description = (
		<>
			{ descriptionText }

			{ addedBy.text && ! isAddedByActiveTheme && (
				<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description">
					<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description-author">
						<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description-author-icon">
							{ addedBy.imageUrl ? (
								<img
									src={ addedBy.imageUrl }
									alt=""
									width="24"
									height="24"
								/>
							) : (
								<Icon icon={ addedBy.icon } />
							) }
						</span>
						{ addedBy.text }
					</span>

					{ addedBy.isCustomized && (
						<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description-customized">
							{ _x( '(Customized)', 'pattern' ) }
						</span>
					) }
				</span>
			) }
		</>
	);

	return { title, description };
}

export default function SidebarNavigationScreenPattern() {
	const { params } = useNavigator();
	const { postType, postId } = params;
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );

	useInitEditedEntityFromURL();

	const { title, description } = usePatternTitleAndDescription(
		postType,
		postId
	);

	return (
		<SidebarNavigationScreen
			title={ title }
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			backPath={ '/library' }
			description={ description }
		/>
	);
}
