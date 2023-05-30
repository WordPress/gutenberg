/**
 * WordPress dependencies
 */
import { __, sprintf, _x } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { pencil, header, footer } from '@wordpress/icons';
import {
	__experimentalUseNavigator as useNavigator,
	Button,
	Icon,
} from '@wordpress/components';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { humanTimeDiff } from '@wordpress/date';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import useEditedEntityRecord from '../use-edited-entity-record';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import { useAddedBy } from '../list/added-by';
import SidebarDetails from '../sidebar-navigation-data-list';
import DataListItem from '../sidebar-navigation-data-list/data-list-item';
import SidebarNavigationSubtitle from '../sidebar-navigation-subtitle';
import { createInterpolateElement } from '@wordpress/element';

function useTemplateTitleAndDescription( postType, postId ) {
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

	return { title, description };
}

export default function SidebarNavigationScreenTemplate() {
	const { params } = useNavigator();
	const { postType, postId } = params;
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { title, description } = useTemplateTitleAndDescription(
		postType,
		postId
	);
	const { record } = useEntityRecord( 'postType', 'wp_template', postId );

	return record ? (
		<SidebarNavigationScreen
			title={ title }
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			content={
				<>
					<SidebarNavigationSubtitle>Areas</SidebarNavigationSubtitle>
					<SidebarDetails
						details={ [
							{
								label: 'Header',
								value: (
									<Button
										variant="tertiary"
										as="a"
										icon={ header }
									>
										Primary
									</Button>
								),
							},
							{
								label: 'Footer',
								value: (
									<Button
										variant="tertiary"
										as="a"
										icon={ footer }
									>
										Footer
									</Button>
								),
							},
						] }
					/>
				</>
			}
			footer={
				<DataListItem
					label={ __( 'Last modified' ) }
					value={ createInterpolateElement(
						sprintf(
							/* translators: %s: is the relative time when the post was last modified. */
							__( '<time>%s</time>' ),
							humanTimeDiff( record.modified )
						),
						{
							time: <time dateTime={ record.modified } />,
						}
					) }
				/>
			}
			description={ description }
		/>
	) : null;
}
