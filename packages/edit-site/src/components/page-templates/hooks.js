/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	commentAuthorAvatar as authorIcon,
	layout as themeIcon,
	plugins as pluginIcon,
	globe as globeIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { TEMPLATE_ORIGINS } from '../../utils/constants';

/** @typedef {'wp_template'|'wp_template_part'} TemplateType */

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
			const originalSource = template?.original_source;
			const authorText = template?.author_text;

			switch ( originalSource ) {
				case 'theme': {
					return {
						type: originalSource,
						icon: themeIcon,
						text: authorText,
						isCustomized:
							template.source === TEMPLATE_ORIGINS.custom,
					};
				}
				case 'plugin': {
					return {
						type: originalSource,
						icon: pluginIcon,
						text: authorText,
						isCustomized:
							template.source === TEMPLATE_ORIGINS.custom,
					};
				}
				case 'site': {
					const siteData = getEntityRecord(
						'root',
						'__unstableBase'
					);
					return {
						type: originalSource,
						icon: globeIcon,
						imageUrl: siteData?.site_logo
							? getMedia( siteData.site_logo )?.source_url
							: undefined,
						text: authorText,
						isCustomized: false,
					};
				}
				default: {
					const user = getUser( template.author );
					return {
						type: 'user',
						icon: authorIcon,
						imageUrl: user?.avatar_urls?.[ 48 ],
						text: authorText,
						isCustomized: false,
					};
				}
			}
		},
		[ postType, postId ]
	);
}
