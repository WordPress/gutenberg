/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__unstableMotion as motion,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import SiteIcon from '../site-icon';
import { unlock } from '../../private-apis';

const HUB_ANIMATION_DURATION = 0.3;

const SiteHub = forwardRef( ( props, ref ) => {
	const { canvasMode, dashboardLink } = useSelect( ( select ) => {
		const { getCanvasMode, getSettings } = unlock(
			select( editSiteStore )
		);
		return {
			canvasMode: getCanvasMode(),
			dashboardLink: getSettings().__experimentalDashboardLink,
		};
	}, [] );
	const disableMotion = useReducedMotion();
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const isBackToDashboardButton = canvasMode === 'view';
	const showLabels = canvasMode !== 'edit';
	const siteIconButtonProps = isBackToDashboardButton
		? {
				href: dashboardLink || 'index.php',
				'aria-label': __( 'Go back to the dashboard' ),
		  }
		: {
				label: __( 'Open Navigation Sidebar' ),
				onClick: () => {
					clearSelectedBlock();
					setCanvasMode( 'view' );
				},
		  };
	const siteTitle = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'root', 'site' )?.title,
		[]
	);

	return (
		<motion.div
			ref={ ref }
			{ ...props }
			className={ classnames( 'edit-site-site-hub', props.className ) }
			layout
			transition={ {
				type: 'tween',
				duration: disableMotion ? 0 : HUB_ANIMATION_DURATION,
				ease: 'easeOut',
			} }
		>
			<HStack
				justify="flex-start"
				className="edit-site-site-hub__text-content"
				spacing="0"
			>
				<motion.div
					className="edit-site-site-hub__view-mode-toggle-container"
					layout
					transition={ {
						type: 'tween',
						duration: disableMotion ? 0 : HUB_ANIMATION_DURATION,
						ease: 'easeOut',
					} }
				>
					<Button
						{ ...siteIconButtonProps }
						className="edit-site-layout__view-mode-toggle"
					>
						<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
					</Button>
				</motion.div>

				{ showLabels && (
					<div className="edit-site-site-hub__site-title">
						{ siteTitle }
					</div>
				) }
			</HStack>
		</motion.div>
	);
} );

export default SiteHub;
