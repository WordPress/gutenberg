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
	Icon as WCIcon,
	__unstableMotion as motion,
} from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import {
	wordpress,
	arrowUpLeft,
	arrowUpRight,
	chevronLeft,
	chevronRight,
} from '@wordpress/icons';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useReducedMotion } from '@wordpress/compose';

const siteIconVariants = {
	edit: {
		clipPath: 'inset(0% round 0px)',
	},
	hover: {
		clipPath: 'inset( 22% round 2px )',
	},
	tap: {
		clipPath: 'inset(0% round 0px)',
	},
};

const toggleHomeIconVariants = {
	edit: {
		opacity: 0,
		scale: 0.2,
	},
	hover: {
		opacity: 1,
		scale: 1,
		clipPath: 'inset( 22% round 2px )',
	},
};

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
		[ initialPost?.type ]
	);

	const disableMotion = useReducedMotion();
	const transition = {
		duration: disableMotion ? 0 : 0.2,
	};

	if ( ! postType ) {
		return null;
	}

	// Create SiteIcon equivalent structure exactly like edit-site
	let siteIconContent;
	if ( isRequestingSiteIcon && ! siteIconUrl ) {
		siteIconContent = (
			<div className="edit-post-fullscreen-mode-close-site-icon__image" />
		);
	} else if ( siteIconUrl ) {
		siteIconContent = (
			<img
				className="edit-post-fullscreen-mode-close-site-icon__image"
				alt={ __( 'Site Icon' ) }
				src={ siteIconUrl }
			/>
		);
	} else {
		siteIconContent = (
			<WCIcon
				className="edit-post-fullscreen-mode-close-site-icon__icon"
				icon={ wordpress }
				size={ 48 }
			/>
		);
	}

	// Override default icon if custom icon is provided via props.
	const buttonIcon = icon ? (
		<WCIcon size="36px" icon={ icon } />
	) : (
		<div className="edit-post-fullscreen-mode-close-site-icon">
			{ siteIconContent }
		</div>
	);

	const classes = clsx( 'edit-post-fullscreen-mode-close', {
		'has-icon': siteIconUrl,
	} );

	const buttonHref =
		href ??
		addQueryArgs( 'edit.php', {
			post_type: postType.slug,
		} );

	const buttonLabel = postType?.labels?.view_items ?? __( 'Back' );

	const hasAdminBarInEditor = window.__experimentalAdminBarInEditor;

	return (
		<motion.div
			className="edit-post-fullscreen-mode-close__view-mode-toggle"
			animate="edit"
			initial="edit"
			whileHover="hover"
			whileTap="tap"
			transition={ transition }
		>
			<Button
				__next40pxDefaultSize
				className={ classes }
				href={ buttonHref }
				label={ buttonLabel }
				showTooltip={ showTooltip }
				tooltipPosition="bottom"
			>
				{ ! hasAdminBarInEditor && (
					<motion.div
						variants={ ! disableMotion && siteIconVariants }
					>
						<div className="edit-post-fullscreen-mode-close__view-mode-toggle-icon">
							{ buttonIcon }
						</div>
					</motion.div>
				) }
			</Button>
			{ hasAdminBarInEditor ? (
				<div className="edit-post-fullscreen-mode-close__back-icon">
					<WCIcon icon={ isRTL() ? chevronRight : chevronLeft } />
				</div>
			) : (
				<motion.div
					className={ clsx(
						'edit-post-fullscreen-mode-close__back-icon',
						{
							'has-site-icon': siteIconUrl,
						}
					) }
					variants={ ! disableMotion && toggleHomeIconVariants }
				>
					<WCIcon icon={ isRTL() ? arrowUpRight : arrowUpLeft } />
				</motion.div>
			) }
		</motion.div>
	);
}

export default FullscreenModeClose;
