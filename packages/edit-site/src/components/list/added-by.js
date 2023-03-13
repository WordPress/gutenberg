/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack, Icon } from '@wordpress/components';
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

function AddedByTheme( { slug, isCustomized, templateType } ) {
	const theme = useSelect(
		( select ) => select( coreStore ).getTheme( slug ),
		[ slug ]
	);

	return (
		<BaseAddedBy
			icon={ themeIcon }
			text={ theme?.name?.rendered || slug }
			isCustomized={ isCustomized }
			templateType={ templateType }
		/>
	);
}

function AddedByPlugin( { slug, isCustomized, templateType } ) {
	const plugin = useSelect(
		( select ) => select( coreStore ).getPlugin( slug ),
		[ slug ]
	);

	return (
		<BaseAddedBy
			icon={ pluginIcon }
			text={ plugin?.name || slug }
			isCustomized={ isCustomized }
			templateType={ templateType }
		/>
	);
}

function AddedByAuthor( { id, templateType } ) {
	const user = useSelect(
		( select ) => select( coreStore ).getUser( id ),
		[ id ]
	);

	return (
		<BaseAddedBy
			icon={ authorIcon }
			imageUrl={ user?.avatar_urls?.[ 48 ] }
			text={ user?.nickname }
			templateType={ templateType }
		/>
	);
}

function AddedBySite( { templateType } ) {
	const { name, logoURL } = useSelect( ( select ) => {
		const { getEntityRecord, getMedia } = select( coreStore );
		const siteData = getEntityRecord( 'root', '__unstableBase' );

		return {
			name: siteData?.name,
			logoURL: siteData?.site_logo
				? getMedia( siteData.site_logo )?.source_url
				: undefined,
		};
	}, [] );

	return (
		<BaseAddedBy
			icon={ globeIcon }
			imageUrl={ logoURL }
			text={ name }
			templateType={ templateType }
		/>
	);
}

export default function AddedBy( { templateType, template } ) {
	if ( ! template ) {
		return;
	}

	if ( TEMPLATE_POST_TYPE_NAMES.includes( templateType ) ) {
		// Template originally provided by a theme, but customized by a user.
		// Templates originally didn't have the 'origin' field so identify
		// older customized templates by checking for no origin and a 'theme'
		// or 'custom' source.
		if (
			template.has_theme_file &&
			( template.origin === 'theme' ||
				( ! template.origin &&
					[ 'theme', 'custom' ].includes( template.source ) ) )
		) {
			return (
				<AddedByTheme
					slug={ template.theme }
					isCustomized={ template.source === 'custom' }
					templateType={ templateType }
				/>
			);
		}

		// Template originally provided by a plugin, but customized by a user.
		if ( template.has_theme_file && template.origin === 'plugin' ) {
			return (
				<AddedByPlugin
					slug={ template.theme }
					isCustomized={ template.source === 'custom' }
					templateType={ templateType }
				/>
			);
		}

		// Template was created from scratch, but has no author. Author support
		// was only added to templates in WordPress 5.9. Fallback to showing the
		// site logo and title.
		if (
			! template.has_theme_file &&
			template.source === 'custom' &&
			! template.author
		) {
			return <AddedBySite templateType={ templateType } />;
		}
	}

	// Simply show the author for templates created from scratch that have an
	// author or for any other post type.
	return (
		<AddedByAuthor id={ template.author } templateType={ templateType } />
	);
}
