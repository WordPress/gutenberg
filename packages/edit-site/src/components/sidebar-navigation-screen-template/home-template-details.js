/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { debounce } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	CheckboxControl,
	__experimentalInputControl as InputControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
} from '../sidebar-navigation-screen-details-panel';

const EMPTY_OBJECT = {};

export default function HomeTemplateDetails() {
	const { editEntityRecord } = useDispatch( coreStore );

	const {
		allowCommentsOnNewPosts,
		postsPerPage,
		postsPageTitle,
		postsPageId,
	} = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const siteSettings = getEntityRecord( 'root', 'site' );
		const _postsPageRecord = siteSettings?.page_for_posts
			? getEntityRecord(
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
		};
	}, [] );

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
						label={ __( 'Allow comments on new posts' ) }
						help={ __(
							'Changes will apply to new posts only. Individual posts may override these settings.'
						) }
						checked={ commentsOnNewPostsValue }
						onChange={ setAllowCommentsOnNewPosts }
					/>
				</SidebarNavigationScreenDetailsPanelRow>
			</SidebarNavigationScreenDetailsPanel>
		</>
	);
}
