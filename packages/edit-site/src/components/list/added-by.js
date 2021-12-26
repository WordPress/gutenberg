/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	Icon,
	Tooltip,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	commentAuthorAvatar as authorIcon,
	layout as themeIcon,
	plugins as pluginIcon,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const TEMPLATE_POST_TYPE_NAMES = [ 'wp_template', 'wp_template_part' ];

function CustomizedTooltip( { isCustomized, children } ) {
	if ( ! isCustomized ) {
		return children;
	}

	return (
		<Tooltip text={ __( 'This template has been customized' ) }>
			{ children }
		</Tooltip>
	);
}

function AddedByTheme( { slug, isCustomized } ) {
	const theme = useSelect(
		( select ) => select( coreStore ).getTheme( slug ),
		[ slug ]
	);

	return (
		<HStack alignment="left">
			<CustomizedTooltip isCustomized={ isCustomized }>
				<div
					className={ classnames( 'edit-site-list-added-by__icon', {
						'is-customized': isCustomized,
					} ) }
				>
					<Icon icon={ themeIcon } />
				</div>
			</CustomizedTooltip>
			<span>{ theme?.name?.rendered || slug }</span>
		</HStack>
	);
}

function AddedByPlugin( { slug, isCustomized } ) {
	const plugin = useSelect(
		( select ) => select( coreStore ).getPlugin( slug ),
		[ slug ]
	);

	return (
		<HStack alignment="left">
			<CustomizedTooltip isCustomized={ isCustomized }>
				<div
					className={ classnames( 'edit-site-list-added-by__icon', {
						'is-customized': isCustomized,
					} ) }
				>
					<Icon icon={ pluginIcon } />
				</div>
			</CustomizedTooltip>
			<span>{ plugin?.name || slug }</span>
		</HStack>
	);
}

function AddedByAuthor( { id } ) {
	const user = useSelect( ( select ) => select( coreStore ).getUser( id ), [
		id,
	] );
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );

	const avatarURL = user?.avatar_urls?.[ 48 ];
	const hasAvatar = !! avatarURL;

	return (
		<HStack alignment="left">
			<div
				className={ classnames(
					hasAvatar
						? 'edit-site-list-added-by__avatar'
						: 'edit-site-list-added-by__icon',
					{
						'is-loaded': isImageLoaded,
					}
				) }
			>
				{ hasAvatar ? (
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt=""
						src={ avatarURL }
					/>
				) : (
					<Icon icon={ authorIcon } />
				) }
			</div>
			<span>{ user?.nickname }</span>
		</HStack>
	);
}

function AddedBySite() {
	const { name, logoURL } = useSelect( ( select ) => {
		const { getEntityRecord, getMedia } = select( coreStore );
		const siteData = getEntityRecord( 'root', '__unstableBase' );

		return {
			name: siteData.name,
			logoURL: siteData?.site_logo
				? getMedia( siteData.site_logo )?.source_url
				: undefined,
		};
	}, [] );
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );

	return (
		<HStack alignment="left">
			<div
				className={ classnames( 'edit-site-list-added-by__avatar', {
					'is-loaded': isImageLoaded,
				} ) }
			>
				<img
					onLoad={ () => setIsImageLoaded( true ) }
					alt=""
					src={ logoURL }
				/>
			</div>
			<span>{ name }</span>
		</HStack>
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
				/>
			);
		}

		// Template originally provided by a plugin, but customized by a user.
		if ( template.has_theme_file && template.origin === 'plugin' ) {
			return (
				<AddedByPlugin
					slug={ template.theme }
					isCustomized={ template.source === 'custom' }
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
			return <AddedBySite />;
		}
	}

	// Simply show the author for templates created from scratch that have an
	// author or for any other post type.
	return <AddedByAuthor id={ template.author } />;
}
