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
	Button,
	Icon,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';
import { header, footer, layout, chevronRightSmall } from '@wordpress/icons';
import { useMemo, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import { useLink } from '../routes/link';

const EMPTY_OBJECT = {};

function TemplateAreaButton( { postId, icon, label } ) {
	const icons = {
		header,
		footer,
	};
	const linkInfo = useLink( {
		postType: 'wp_template_part',
		postId,
	} );

	return (
		<Button
			as="a"
			className="edit-site-sidebar-navigation-screen-template__template-area-button"
			icon={ icons[ icon ] ?? layout }
			{ ...linkInfo }
		>
			{ label }
			<Icon icon={ chevronRightSmall } />
		</Button>
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
		isHomePageBlog,
		postsPerPage,
		siteTitle,
		templateRecord,
	} = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const { getSettings } = unlock( select( editSiteStore ) );
			const siteEditorSettings = getSettings();
			const _templateRecord =
				select( coreStore ).getEditedEntityRecord(
					'postType',
					postType,
					postId
				) || EMPTY_OBJECT;

			return {
				templateRecord: _templateRecord,
				isHomePageBlog:
					siteSettings?.page_for_posts ===
					siteSettings?.page_on_front,
				allowCommentsOnNewPosts:
					siteSettings?.default_comment_status === 'open',
				siteTitle: siteSettings?.title,
				postsPerPage: siteSettings?.posts_per_page,
				templatePartAreas: siteEditorSettings?.defaultTemplatePartAreas,
			};
		},
		[ postType, postId ]
	);

	const [ commentsOnNewPosts, setCommentsOnNewPosts ] = useState( null );
	const [ postsCount, setPostsCount ] = useState( '' );
	const [ siteTitleValue, setSiteTitleValue ] = useState( '' );

	useEffect( () => {
		setCommentsOnNewPosts( allowCommentsOnNewPosts );
		setSiteTitleValue( siteTitle );
		setPostsCount( postsPerPage );
	}, [ siteTitle, allowCommentsOnNewPosts, postsPerPage ] );

	const templateAreas = useMemo( () => {
		return templateRecord?.blocks && templatePartAreas
			? templateRecord.blocks
					.filter(
						( { name, attributes } ) =>
							name === 'core/template-part' &&
							( attributes?.slug === 'header' ||
								attributes?.slug === 'footer' )
					)
					.map( ( { attributes } ) => ( {
						...templatePartAreas?.find(
							( { area } ) => area === attributes?.slug
						),
						...attributes,
					} ) )
			: [];
	}, [ templateRecord?.blocks, templatePartAreas ] );

	const setAllowCommentsOnNewPosts = ( newValue ) => {
		setCommentsOnNewPosts( newValue );
		editEntityRecord( 'root', 'site', undefined, {
			default_comment_status: newValue ? 'open' : null,
		} );
	};

	const setSiteTitle = ( newValue ) => {
		setSiteTitleValue( newValue );
		editEntityRecord( 'root', 'site', undefined, {
			title: newValue,
		} );
	};

	const setPostsPerPage = ( newValue ) => {
		setPostsCount( newValue );
		editEntityRecord( 'root', 'site', undefined, {
			posts_per_page: newValue,
		} );
	};

	return (
		<>
			<SidebarNavigationScreenDetailsPanel title={ __( 'Settings' ) }>
				{ isHomePageBlog && (
					<SidebarNavigationScreenDetailsPanelRow>
						<SidebarNavigationScreenDetailsPanelLabel>
							{ __( 'Posts per page' ) }
						</SidebarNavigationScreenDetailsPanelLabel>
						<SidebarNavigationScreenDetailsPanelValue>
							<InputControl
								className="edit-site-sidebar-navigation-screen__input-control"
								placeholder={ 0 }
								value={ postsCount }
								type="number"
								onChange={ debounce( setPostsPerPage, 300 ) }
							/>
						</SidebarNavigationScreenDetailsPanelValue>
					</SidebarNavigationScreenDetailsPanelRow>
				) }
				<SidebarNavigationScreenDetailsPanelRow>
					<SidebarNavigationScreenDetailsPanelLabel>
						{ __( 'Blog title' ) }
					</SidebarNavigationScreenDetailsPanelLabel>
					<SidebarNavigationScreenDetailsPanelValue>
						<InputControl
							className="edit-site-sidebar-navigation-screen__input-control"
							placeholder={ __( 'No Title' ) }
							value={ siteTitleValue }
							onChange={ debounce( setSiteTitle, 300 ) }
						/>
					</SidebarNavigationScreenDetailsPanelValue>
				</SidebarNavigationScreenDetailsPanelRow>
			</SidebarNavigationScreenDetailsPanel>

			<SidebarNavigationScreenDetailsPanel title={ __( 'Discussion' ) }>
				<SidebarNavigationScreenDetailsPanelRow>
					<CheckboxControl
						label="Allow comments on new posts"
						help="Individual posts may override these settings. Changes here will only be applied to new posts."
						checked={ commentsOnNewPosts }
						onChange={ debounce( setAllowCommentsOnNewPosts, 300 ) }
					/>
				</SidebarNavigationScreenDetailsPanelRow>
			</SidebarNavigationScreenDetailsPanel>
			<SidebarNavigationScreenDetailsPanel title={ __( 'Areas' ) }>
				{ templateAreas.map( ( { label, icon, theme, slug } ) => (
					<SidebarNavigationScreenDetailsPanelRow key={ slug }>
						<SidebarNavigationScreenDetailsPanelLabel>
							{ label }
						</SidebarNavigationScreenDetailsPanelLabel>
						<SidebarNavigationScreenDetailsPanelValue>
							<TemplateAreaButton
								postId={ `${ theme }//${ slug }` }
								label={ label }
								icon={ icon }
							/>
						</SidebarNavigationScreenDetailsPanelValue>
					</SidebarNavigationScreenDetailsPanelRow>
				) ) }
			</SidebarNavigationScreenDetailsPanel>
		</>
	);
}
