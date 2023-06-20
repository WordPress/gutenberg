/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { debounce } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	CheckboxControl,
	__experimentalUseNavigator as useNavigator,
	__experimentalInputControl as InputControl,
	__experimentalNumberControl as NumberControl,
	__experimentalTruncate as Truncate,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { header, footer, layout } from '@wordpress/icons';
import { useMemo, useState, useEffect } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
} from '../sidebar-navigation-screen-details-panel';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';

const EMPTY_OBJECT = {};

function TemplateAreaButton( { postId, icon, title } ) {
	const icons = {
		header,
		footer,
	};
	const linkInfo = useLink( {
		postType: 'wp_template_part',
		postId,
	} );

	return (
		<SidebarNavigationItem
			className="edit-site-sidebar-navigation-screen-template__template-area-button"
			{ ...linkInfo }
			icon={ icons[ icon ] ?? layout }
			withChevron
		>
			<Truncate
				limit={ 20 }
				ellipsizeMode="tail"
				numberOfLines={ 1 }
				className="edit-site-sidebar-navigation-screen-template__template-area-label-text"
			>
				{ decodeEntities( title ) }
			</Truncate>
		</SidebarNavigationItem>
	);
}

export default function HomeTemplateDetails() {
	const navigator = useNavigator();
	const {
		params: { postType, postId },
	} = navigator;
	const { editEntityRecord } = useDispatch( coreStore );

	const {
		allowCommentsOnNewPosts,
		templatePartAreas,
		postsPerPage,
		postsPageTitle,
		postsPageId,
		currentTemplateParts,
	} = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const { getSettings } = unlock( select( editSiteStore ) );
			const _currentTemplateParts =
				select( editSiteStore ).getCurrentTemplateTemplateParts();
			const siteEditorSettings = getSettings();
			const _postsPageRecord = siteSettings?.page_for_posts
				? select( coreStore ).getEntityRecord(
						'postType',
						'page',
						siteSettings?.page_for_posts
				  )
				: EMPTY_OBJECT;

			return {
				allowCommentsOnNewPosts:
					siteSettings?.default_comment_status === 'open',
				postsPageTitle: _postsPageRecord?.title?.rendered,
				postsPageId: _postsPageRecord?.id,
				postsPerPage: siteSettings?.posts_per_page,
				templatePartAreas: siteEditorSettings?.defaultTemplatePartAreas,
				currentTemplateParts: _currentTemplateParts,
			};
		},
		[ postType, postId ]
	);

	const [ commentsOnNewPostsValue, setCommentsOnNewPostsValue ] =
		useState( '' );
	const [ postsCountValue, setPostsCountValue ] = useState( 1 );
	const [ postsPageTitleValue, setPostsPageTitleValue ] = useState( '' );

	/*
	 * This hook serves to set the server-retrieved values,
	 * postsPageTitle, allowCommentsOnNewPosts, postsPerPage,
	 * to local state.
	 */
	useEffect( () => {
		setCommentsOnNewPostsValue( allowCommentsOnNewPosts );
		setPostsPageTitleValue( postsPageTitle );
		setPostsCountValue( postsPerPage );
	}, [ postsPageTitle, allowCommentsOnNewPosts, postsPerPage ] );

	/*
	 * Merge data in currentTemplateParts with templatePartAreas,
	 * which contains the template icon and fallback labels
	 */
	const templateAreas = useMemo( () => {
		return currentTemplateParts.length && templatePartAreas
			? currentTemplateParts.map( ( { templatePart } ) => ( {
					...templatePartAreas?.find(
						( { area } ) => area === templatePart?.area
					),
					...templatePart,
			  } ) )
			: [];
	}, [ currentTemplateParts, templatePartAreas ] );

	const setAllowCommentsOnNewPosts = ( newValue ) => {
		setCommentsOnNewPostsValue( newValue );
		editEntityRecord( 'root', 'site', undefined, {
			default_comment_status: newValue ? 'open' : null,
		} );
	};

	const setPostsPageTitle = ( newValue ) => {
		setPostsPageTitleValue( newValue );
		editEntityRecord( 'postType', 'page', postsPageId, {
			title: newValue,
		} );
	};

	const setPostsPerPage = ( newValue ) => {
		setPostsCountValue( newValue );
		editEntityRecord( 'root', 'site', undefined, {
			posts_per_page: newValue,
		} );
	};

	return (
		<>
			<SidebarNavigationScreenDetailsPanel spacing={ 6 }>
				{ postsPageId && (
					<SidebarNavigationScreenDetailsPanelRow>
						<InputControl
							className="edit-site-sidebar-navigation-screen__input-control"
							placeholder={ __( 'No Title' ) }
							size={ '__unstable-large' }
							value={ postsPageTitleValue }
							onChange={ debounce( setPostsPageTitle, 300 ) }
							label={ __( 'Blog title' ) }
							help={ __(
								'Set the Posts Page title. Appears in search results, and when the page is shared on social media.'
							) }
						/>
					</SidebarNavigationScreenDetailsPanelRow>
				) }
				<SidebarNavigationScreenDetailsPanelRow>
					<NumberControl
						className="edit-site-sidebar-navigation-screen__input-control"
						placeholder={ 0 }
						value={ postsCountValue }
						size={ '__unstable-large' }
						spinControls="custom"
						step="1"
						min="1"
						onChange={ setPostsPerPage }
						label={ __( 'Posts per page' ) }
						help={ __(
							'Set the default number of posts to display on blog pages, including categories and tags. Some templates may override this setting.'
						) }
					/>
				</SidebarNavigationScreenDetailsPanelRow>
			</SidebarNavigationScreenDetailsPanel>

			<SidebarNavigationScreenDetailsPanel
				title={ __( 'Discussion' ) }
				spacing={ 3 }
			>
				<SidebarNavigationScreenDetailsPanelRow>
					<CheckboxControl
						className="edit-site-sidebar-navigation-screen__input-control"
						label="Allow comments on new posts"
						help="Changes will apply to new posts only. Individual posts may override these settings."
						checked={ commentsOnNewPostsValue }
						onChange={ setAllowCommentsOnNewPosts }
					/>
				</SidebarNavigationScreenDetailsPanelRow>
			</SidebarNavigationScreenDetailsPanel>
			<SidebarNavigationScreenDetailsPanel
				title={ __( 'Areas' ) }
				spacing={ 3 }
			>
				<ItemGroup>
					{ templateAreas.map(
						( { label, icon, theme, slug, title } ) => (
							<SidebarNavigationScreenDetailsPanelRow
								key={ slug }
							>
								<TemplateAreaButton
									postId={ `${ theme }//${ slug }` }
									title={ title?.rendered || label }
									icon={ icon }
								/>
							</SidebarNavigationScreenDetailsPanelRow>
						)
					) }
				</ItemGroup>
			</SidebarNavigationScreenDetailsPanel>
		</>
	);
}
