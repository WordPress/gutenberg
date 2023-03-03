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

const TEMPLATE_POST_TYPE_NAMES = [ 'wp_template', 'wp_template_part' ];

/**
 *
 * @typedef AddedByData
 * @type {Object}
 * @property {JSX.Element} icon         The icon to display.
 * @property {string}      [imageUrl]   The optional image URL to display.
 * @property {string}      [text]       The text to display.
 * @property {boolean}     isCustomized Whether the template has been customized.
 *
 * @param    {Object}      template     The template object.
 * @return {AddedByData} The added by object or null.
 */
export function useAddedBy( template ) {
	return useSelect(
		( select ) => {
			const { getTheme, getPlugin, getEntityRecord, getMedia, getUser } =
				select( coreStore );
			if ( TEMPLATE_POST_TYPE_NAMES.includes( template.type ) ) {
				// Added by theme.
				// Template originally provided by a theme, but customized by a user.
				// Templates originally didn't have the 'origin' field so identify
				// older customized templates by checking for no origin and a 'theme'
				// or 'custom' source.
				if (
					template.has_theme_file &&
					( template.origin === 'theme' ||
						( ! template.origin &&
							[ 'theme', 'custom' ].includes(
								template.source
							) ) )
				) {
					return {
						icon: themeIcon,
						text:
							getTheme( template.theme )?.name?.rendered ||
							template.theme,
						isCustomized: template.source === 'custom',
					};
				}

				// Added by plugin.
				// Template originally provided by a plugin, but customized by a user.
				if ( template.has_theme_file && template.origin === 'plugin' ) {
					return {
						icon: pluginIcon,
						text:
							getPlugin( template.theme )?.name || template.theme,
						isCustomized: template.source === 'custom',
					};
				}

				// Added by site.
				// Template was created from scratch, but has no author. Author support
				// was only added to templates in WordPress 5.9. Fallback to showing the
				// site logo and title.
				if (
					! template.has_theme_file &&
					template.source === 'custom' &&
					! template.author
				) {
					const siteData = getEntityRecord(
						'root',
						'__unstableBase'
					);
					return {
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
				icon: authorIcon,
				imageUrl: user?.avatar_urls?.[ 48 ],
				text: user?.nickname,
				isCustomized: false,
			};
		},
		[ template ]
	);
}

function BaseAddedBy( { text, icon, imageUrl, isCustomized, templateType } ) {
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );

	return (
		<HStack alignment="left">
			{ imageUrl ? (
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
			) : (
				<div className="edit-site-list-added-by__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span>
				{ text }
				{ isCustomized && (
					<span className="edit-site-list-added-by__customized-info">
						{ templateType === 'wp_template'
							? _x( 'Customized', 'template' )
							: _x( 'Customized', 'template part' ) }
					</span>
				) }
			</span>
		</HStack>
	);
}

export default function AddedBy( { template } ) {
	const addedBy = useAddedBy( template );

	return (
		<BaseAddedBy
			icon={ addedBy.icon }
			imageUrl={ addedBy.imageUrl }
			text={ addedBy.text }
			isCustomized={ addedBy.isCustomized }
			templateType={ template.type }
		/>
	);
}
