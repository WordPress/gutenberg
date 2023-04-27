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
	__unstableAnimatePresence as AnimatePresence,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import SiteIcon from '../site-icon';
import { unlock } from '../../private-apis';

const HUB_ANIMATION_DURATION = 0.3;

const SiteHub = forwardRef( ( props, ref ) => {
	const { canvasMode } = useSelect( ( select ) => {
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
	const siteIconButtonProps = {
		label: __( 'Open Admin Sidebar' ),
		onClick: () => {
			if ( canvasMode === 'edit' ) {
				clearSelectedBlock();
				setCanvasMode( 'view' );
			}
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
			initial={ false }
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
						<motion.div
							initial={ false }
							animate={ {
								scale: canvasMode === 'view' ? 0.5 : 1,
							} }
							whileHover={ {
								scale: canvasMode === 'view' ? 0.5 : 0.96,
							} }
							transition={ {
								type: 'tween',
								duration: disableMotion
									? 0
									: HUB_ANIMATION_DURATION,
								ease: 'easeOut',
							} }
						>
							<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
						</motion.div>
					</Button>
				</motion.div>

				<AnimatePresence>
					<motion.div
						layout={ canvasMode === 'edit' }
						animate={ {
							opacity: canvasMode === 'view' ? 1 : 0,
						} }
						exit={ {
							opacity: 0,
						} }
						className="edit-site-site-hub__site-title"
						transition={ {
							type: 'tween',
							duration: disableMotion ? 0 : 0.2,
							ease: 'easeOut',
							delay: canvasMode === 'view' ? 0.1 : 0,
						} }
					>
						{ decodeEntities( siteTitle ) }
					</motion.div>
				</AnimatePresence>
			</HStack>
		</motion.div>
	);
} );

export default SiteHub;
