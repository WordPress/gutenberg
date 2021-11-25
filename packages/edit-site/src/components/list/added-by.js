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
import {
	layout as themeIcon,
	plugins as pluginIcon,
	commentAuthorAvatar as customizedByUserIcon,
} from '@wordpress/icons';

const TEMPLATE_POST_TYPE_NAMES = [ 'wp_template', 'wp_template_part' ];
const NON_PLUGIN_SOURCES = [ 'theme', 'custom' ];

function AddedByTheme( { slug, isCustomized } ) {
	const theme = useSelect(
		( select ) => select( coreStore ).getTheme( slug ),
		[ slug ]
	);

	return (
		<HStack alignment="left">
			<div
				className={ classnames( 'edit-site-list-added-by__icon', {
					'is-customized': isCustomized,
				} ) }
			>
				<Icon icon={ themeIcon } />
			</div>
			<span>{ theme?.name?.rendered }</span>
		</HStack>
	);
}

function AddedByPlugin( { slug } ) {
	const plugin = useSelect(
		( select ) => select( coreStore ).getPlugin( slug ),
		[ slug ]
	);

	return (
		<HStack alignment="left">
			<div className="edit-site-list-added-by__icon">
				<Icon icon={ pluginIcon } />
			</div>
			<span>{ plugin?.name }</span>
		</HStack>
	);
}

function AddedByAuthor( { id } ) {
	const user = useSelect( ( select ) => select( coreStore ).getUser( id ), [
		id,
	] );

	return (
		<HStack alignment="left">
			<img
				className="edit-site-list-added-by__avatar"
				alt=""
				src={ user?.avatar_urls[ 48 ] }
			/>
			<span>{ user?.nickname }</span>
		</HStack>
	);
}

export default function AddedBy( { templateType, template } ) {
	if ( ! template ) {
		return;
	}

	if ( TEMPLATE_POST_TYPE_NAMES.includes( templateType ) ) {
		if ( template.has_theme_file ) {
			return (
				<AddedByTheme
					slug={ template.theme }
					isCustomized={ template.source === 'custom' }
				/>
			);
		}

		if ( ! NON_PLUGIN_SOURCES.includes( template.source ) ) {
			return <AddedByPlugin slug={ template.source } />;
		}

		// Fallback for any custom template already created without an assigned
		// author.
		if (
			! template.has_theme_file &&
			template.source === 'custom' &&
			! template.author
		) {
			return (
				<HStack alignment="left">
					<div className="edit-site-list-added-by__icon">
						<Icon icon={ customizedByUserIcon } />
					</div>
					<span>Customized by user</span>
				</HStack>
			);
		}
	}

	return <AddedByAuthor id={ template.author } />;
}
