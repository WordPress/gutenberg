/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	Button,
	Icon,
	__unstableMotion as motion,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { wordpress } from '@wordpress/icons';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useReducedMotion } from '@wordpress/compose';

function FullscreenModeClose( { showTooltip, icon, href, initialPost } ) {
	const { isRequestingSiteIcon, postType, siteIconUrl } = useSelect(
		( select ) => {
			const { getCurrentPostType } = select( editorStore );
			const { getEntityRecord, getPostType, isResolving } =
				select( coreStore );
			const siteData =
				getEntityRecord( 'root', '__unstableBase', undefined ) || {};
			const _postType = initialPost?.type || getCurrentPostType();
			return {
				isRequestingSiteIcon: isResolving( 'getEntityRecord', [
					'root',
					'__unstableBase',
					undefined,
				] ),
				postType: getPostType( _postType ),
				siteIconUrl: siteData.site_icon_url,
			};
		},
		[]
	);

	const disableMotion = useReducedMotion();

	if ( ! postType ) {
		return null;
	}

	let buttonIcon = <Icon size="36px" icon={ wordpress } />;

	const effect = {
		expand: {
			scale: 1.25,
			transition: { type: 'tween', duration: '0.3' },
		},
	};

	if ( siteIconUrl ) {
		buttonIcon = (
			<motion.img
				variants={ ! disableMotion && effect }
				alt={ __( 'Site Icon' ) }
				className="edit-post-fullscreen-mode-close_site-icon"
				src={ siteIconUrl }
			/>
		);
	}

	if ( isRequestingSiteIcon ) {
		buttonIcon = null;
	}

	// Override default icon if custom icon is provided via props.
	if ( icon ) {
		buttonIcon = <Icon size="36px" icon={ icon } />;
	}

	const classes = clsx( 'edit-post-fullscreen-mode-close', {
		'has-icon': siteIconUrl,
	} );

	const buttonHref =
		href ??
		addQueryArgs( 'edit.php', {
			post_type: postType.slug,
		} );

	const buttonLabel = postType?.labels?.view_items ?? __( 'Back' );

	return (
		<motion.div whileHover="expand">
			<Button
				className={ classes }
				href={ buttonHref }
				label={ buttonLabel }
				showTooltip={ showTooltip }
			>
				{ buttonIcon }
			</Button>
		</motion.div>
	);
}

export default FullscreenModeClose;
