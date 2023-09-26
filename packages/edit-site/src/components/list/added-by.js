// @ts-check
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, __experimentalHStack as HStack } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	commentAuthorAvatar as authorIcon,
	layout as themeIcon,
	plugins as pluginIcon,
	globe as globeIcon,
} from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_ORIGINS,
} from '../../utils/constants';

/** @typedef {'wp_template'|'wp_template_part'} TemplateType */

/** @type {TemplateType} */
const TEMPLATE_POST_TYPE_NAMES = [
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
];

/**
 * @typedef {'theme'|'plugin'|'site'|'user'} AddedByType
 *
 * @typedef AddedByData
 * @type {Object}
 * @property {AddedByType}  type         The type of the data.
 * @property {JSX.Element}  icon         The icon to display.
 * @property {string}       [imageUrl]   The optional image URL to display.
 * @property {string}       [text]       The text to display.
 * @property {boolean}      isCustomized Whether the template has been customized.
 *
 * @param    {TemplateType} postType     The template post type.
 * @param    {number}       postId       The template post id.
 * @return {AddedByData} The added by object or null.
 */
export function useAddedBy( postType, postId ) {
	return useSelect(
		( select ) => {
			const {
				getTheme,
				getPlugin,
				getEntityRecord,
				getMedia,
				getUser,
				getEditedEntityRecord,
			} = select( coreStore );
			const template = getEditedEntityRecord(
				'postType',
				postType,
				postId
			);

			if ( TEMPLATE_POST_TYPE_NAMES.includes( template.type ) ) {
				// Added by theme.
				// Template originally provided by a theme, but customized by a user.
				// Templates originally didn't have the 'origin' field so identify
				// older customized templates by checking for no origin and a 'theme'
				// or 'custom' source.
				if (
					template.has_theme_file &&
					( template.origin === TEMPLATE_ORIGINS.theme ||
						( ! template.origin &&
							[
								TEMPLATE_ORIGINS.theme,
								TEMPLATE_ORIGINS.custom,
							].includes( template.source ) ) )
				) {
					return {
						type: 'theme',
						icon: themeIcon,
						text:
							getTheme( template.theme )?.name?.rendered ||
							template.theme,
						isCustomized:
							template.source === TEMPLATE_ORIGINS.custom,
					};
				}

				// Added by plugin.
				if (
					template.has_theme_file &&
					template.origin === TEMPLATE_ORIGINS.plugin
				) {
					return {
						type: TEMPLATE_ORIGINS.plugin,
						icon: pluginIcon,
						text:
							getPlugin( template.theme )?.name || template.theme,
						isCustomized:
							template.source === TEMPLATE_ORIGINS.custom,
					};
				}

				// Added by site.
				// Template was created from scratch, but has no author. Author support
				// was only added to templates in WordPress 5.9. Fallback to showing the
				// site logo and title.
				if (
					! template.has_theme_file &&
					template.source === TEMPLATE_ORIGINS.custom &&
					! template.author
				) {
					const siteData = getEntityRecord(
						'root',
						'__unstableBase'
					);
					return {
						type: 'site',
						icon: globeIcon,
						imageUrl: siteData?.site_logo
							? getMedia( siteData.site_logo )?.source_url
							: undefined,
						text: siteData?.name,
						isCustomized: false,
					};
				}
			}

			// Added by user.
			const user = getUser( template.author );
			return {
				type: 'user',
				icon: authorIcon,
				imageUrl: user?.avatar_urls?.[ 48 ],
				text: user?.nickname,
				isCustomized: false,
			};
		},
		[ postType, postId ]
	);
}

/**
 * @param {Object} props
 * @param {string} props.imageUrl
 */
function AvatarImage( { imageUrl } ) {
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );

	return (
		<div
			className={ classnames( 'edit-site-list-added-by__avatar', {
				'is-loaded': isImageLoaded,
			} ) }
		>
			<img
				onLoad={ () => setIsImageLoaded( true ) }
				alt=""
				src={ imageUrl }
			/>
		</div>
	);
}

/**
 * @param {Object}       props
 * @param {TemplateType} props.postType The template post type.
 * @param {number}       props.postId   The template post id.
 */
export default function AddedBy( { postType, postId } ) {
	const { text, icon, imageUrl, isCustomized } = useAddedBy(
		postType,
		postId
	);

	return (
		<HStack alignment="left">
			{ imageUrl ? (
				<AvatarImage imageUrl={ imageUrl } />
			) : (
				<div className="edit-site-list-added-by__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span>
				{ text }
				{ isCustomized && (
					<span className="edit-site-list-added-by__customized-info">
						{ postType === TEMPLATE_POST_TYPE
							? _x( 'Customized', 'template' )
							: _x( 'Customized', 'template part' ) }
					</span>
				) }
			</span>
		</HStack>
	);
}
