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
import { TEMPLATE_POST_TYPE, TEMPLATE_ORIGINS } from '../../utils/constants';

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

/**
 * @param {Object} props
 * @param {string} props.imageUrl
 */
export function AvatarImage( { imageUrl } ) {
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
