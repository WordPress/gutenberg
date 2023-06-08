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
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { header, footer, layout, chevronRightSmall } from '@wordpress/icons';
import { useMemo, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
} from '../sidebar-navigation-screen-details-panel';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import { useLink } from '../routes/link';

const EMPTY_OBJECT = {};

function TemplateAreaButton( { area, postId, icon, title } ) {
	const icons = {
		header,
		footer,
	};
	// Generic area labels - not the same as the template part title defined in "templateParts" in theme.json.
	const areaLabels = {
		header: __( 'Header' ),
		footer: __( 'Footer' ),
	};
	const linkInfo = useLink( {
		postType: 'wp_template_part',
		postId,
	} );

	return (
		<Button
			as="a"
			className="edit-site-sidebar-navigation-screen-template__template-area-button"
			{ ...linkInfo }
		>
			<span className="edit-site-sidebar-navigation-screen-template__template-area-name">
				{ areaLabels[ area ] ?? __( 'Template part' ) }
			</span>
			<span className="edit-site-sidebar-navigation-screen-template__template-area-label">
				<Icon icon={ icons[ icon ] ?? layout } />
				<Truncate
					limit={ 20 }
					ellipsizeMode="tail"
					numberOfLines={ 1 }
					className="edit-site-sidebar-navigation-screen-template__template-area-label-text"
				>
					{ title }
				</Truncate>
				<Icon icon={ chevronRightSmall } />
			</span>
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

	const [ commentsOnNewPosts, setCommentsOnNewPosts ] = useState( '' );
	const [ postsCount, setPostsCount ] = useState( 1 );
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
							( attributes?.tagName === 'header' ||
								attributes?.tagName === 'footer' )
					)
					.map( ( { attributes } ) => ( {
						...templatePartAreas?.find(
							( { area } ) => area === attributes?.tagName
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
			<SidebarNavigationScreenDetailsPanel>
				<SidebarNavigationScreenDetailsPanelRow>
					<InputControl
						className="edit-site-sidebar-navigation-screen__input-control"
						placeholder={ __( 'No Title' ) }
						value={ siteTitleValue }
						onChange={ debounce( setSiteTitle, 300 ) }
						label={ __( 'Site title' ) }
						help={ __( 'Update the title of your site' ) }
					/>
				</SidebarNavigationScreenDetailsPanelRow>
				{ isHomePageBlog && (
					<SidebarNavigationScreenDetailsPanelRow>
						<InputControl
							className="edit-site-sidebar-navigation-screen__input-control"
							placeholder={ 0 }
							value={ postsCount }
							step="1"
							min="1"
							type="number"
							onChange={ debounce( setPostsPerPage, 300 ) }
							label={ __( 'Posts per page' ) }
							help={ __(
								'The maximum amount of posts to display on a page. This setting applies to all blog pages including category and tag archives.'
							) }
						/>
					</SidebarNavigationScreenDetailsPanelRow>
				) }
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
				{ templateAreas.map( ( { label, icon, area, theme, slug } ) => (
					<SidebarNavigationScreenDetailsPanelRow key={ slug }>
						<TemplateAreaButton
							postId={ `${ theme }//${ slug }` }
							title={ label }
							icon={ icon }
							area={ area }
						/>
					</SidebarNavigationScreenDetailsPanelRow>
				) ) }
			</SidebarNavigationScreenDetailsPanel>
		</>
	);
}
