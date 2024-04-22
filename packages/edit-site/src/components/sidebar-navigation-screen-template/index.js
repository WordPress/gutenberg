/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { pencil } from '@wordpress/icons';
import { Icon } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import TemplateAreas from './template-areas';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import useEditedEntityRecord from '../use-edited-entity-record';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import { useAddedBy } from '../page-templates-template-parts/hooks';
import TemplateActions from '../template-actions';
import HomeTemplateDetails from './home-template-details';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';

const { useHistory, useLocation } = unlock( routerPrivateApis );

function useTemplateDetails( postType, postId ) {
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
		descriptionText = __(
			'This is a custom template that can be applied manually to any Post or Page.'
		);
	}

	const content =
		record?.slug === 'home' || record?.slug === 'index' ? (
			<>
				<HomeTemplateDetails />
				<TemplateAreas />
			</>
		) : (
			<TemplateAreas />
		);

	const footer = record?.modified ? (
		<SidebarNavigationScreenDetailsFooter record={ record } />
	) : null;

	const description = (
		<>
			{ descriptionText }

			{ addedBy.text && ! isAddedByActiveTheme && (
				<span className="edit-site-sidebar-navigation-screen-template__added-by-description">
					<span className="edit-site-sidebar-navigation-screen-template__added-by-description-author">
						<span className="edit-site-sidebar-navigation-screen-template__added-by-description-author-icon">
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
						<span className="edit-site-sidebar-navigation-screen-template__added-by-description-customized">
							{ _x( '(Customized)', 'template' ) }
						</span>
					) }
				</span>
			) }
		</>
	);

	return { title, description, content, footer };
}

export default function SidebarNavigationScreenTemplate() {
	const history = useHistory();
	const {
		params: { postType, postId },
	} = useLocation();
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { title, content, description, footer } = useTemplateDetails(
		postType,
		postId
	);

	return (
		<SidebarNavigationScreen
			title={ title }
			actions={
				<>
					<TemplateActions
						postType={ postType }
						postId={ postId }
						toggleProps={ { as: SidebarButton } }
						onRemove={ () => {
							history.push( { path: '/' + postType } );
						} }
					/>
					<SidebarButton
						onClick={ () => setCanvasMode( 'edit' ) }
						label={ __( 'Edit' ) }
						icon={ pencil }
					/>
				</>
			}
			description={ description }
			content={ content }
			footer={ footer }
		/>
	);
}
