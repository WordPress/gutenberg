/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef, useEffect } from '@wordpress/element';
import {
	__unstableUseNavigateRegions as useNavigateRegions,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import {
	useMergeRefs,
	useReducedMotion,
	useViewportMatch,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import NavigableRegion from '../navigable-region';

const SECONDARY_SIDEBAR_WIDTH = 350;
const SECONDARY_SIDEBAR_DIALOG_WIDTH = 650;
const ANIMATION_DURATION = 0.25;

function useHTMLClass( className ) {
	useEffect( () => {
		const element =
			document && document.querySelector( `html:not(.${ className })` );
		if ( ! element ) {
			return;
		}
		element.classList.toggle( className );
		return () => {
			element.classList.toggle( className );
		};
	}, [ className ] );
}

const headerVariants = {
	hidden: { opacity: 0 },
	hover: {
		opacity: 1,
		transition: { type: 'tween', delay: 0.2, delayChildren: 0.2 },
	},
	distractionFreeInactive: { opacity: 1, transition: { delay: 0 } },
};

const secondarySidebarVariants = {
	open: { width: SECONDARY_SIDEBAR_WIDTH },
	closed: { width: 0 },
	mobileOpen: { width: '100vw' },
};

const secondarySidebarDiaglogVariants = {
	open: { width: SECONDARY_SIDEBAR_DIALOG_WIDTH },
	closed: { width: 0 },
	mobileOpen: { width: '100vw' },
};

function InterfaceSkeleton(
	{
		isDistractionFree,
		isZoomOutMode,
		footer,
		header,
		editorNotices,
		sidebar,
		secondarySidebar,
		notices,
		content,
		actions,
		labels,
		className,
		enableRegionNavigation = true,
		// Todo: does this need to be a prop.
		// Can we use a dependency to keyboard-shortcuts directly?
		shortcuts,
	},
	ref
) {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const disableMotion = useReducedMotion();
	const sidebarAnimationDuration = isZoomOutMode ? 0 : ANIMATION_DURATION;
	const defaultTransition = {
		type: 'tween',
		duration: disableMotion ? 0 : sidebarAnimationDuration,
		ease: 'easeOut',
	};
	const navigateRegionsProps = useNavigateRegions( shortcuts );
	const sidebarWidth = isZoomOutMode
		? SECONDARY_SIDEBAR_DIALOG_WIDTH
		: SECONDARY_SIDEBAR_WIDTH;
	useHTMLClass( 'interface-interface-skeleton__html-container' );

	const defaultLabels = {
		/* translators: accessibility text for the top bar landmark region. */
		header: _x( 'Header', 'header landmark area' ),
		/* translators: accessibility text for the content landmark region. */
		body: __( 'Content' ),
		/* translators: accessibility text for the secondary sidebar landmark region. */
		secondarySidebar: __( 'Block Library' ),
		/* translators: accessibility text for the settings landmark region. */
		sidebar: __( 'Settings' ),
		/* translators: accessibility text for the publish landmark region. */
		actions: __( 'Publish' ),
		/* translators: accessibility text for the footer landmark region. */
		footer: __( 'Footer' ),
	};

	const mergedLabels = { ...defaultLabels, ...labels };

	return (
		<div
			{ ...( enableRegionNavigation ? navigateRegionsProps : {} ) }
			ref={ useMergeRefs( [
				ref,
				enableRegionNavigation ? navigateRegionsProps.ref : undefined,
			] ) }
			className={ classnames(
				className,
				'interface-interface-skeleton',
				navigateRegionsProps.className,
				!! footer && 'has-footer'
			) }
		>
			<div className="interface-interface-skeleton__editor">
				{ !! header && (
					<NavigableRegion
						as={ motion.div }
						className="interface-interface-skeleton__header"
						aria-label={ mergedLabels.header }
						initial={
							isDistractionFree
								? 'hidden'
								: 'distractionFreeInactive'
						}
						whileHover={
							isDistractionFree
								? 'hover'
								: 'distractionFreeInactive'
						}
						animate={
							isDistractionFree
								? 'hidden'
								: 'distractionFreeInactive'
						}
						variants={ headerVariants }
						transition={
							isDistractionFree
								? { type: 'tween', delay: 0.8 }
								: undefined
						}
					>
						{ header }
					</NavigableRegion>
				) }
				{ isDistractionFree && (
					<div className="interface-interface-skeleton__header">
						{ editorNotices }
					</div>
				) }
				<div className="interface-interface-skeleton__body">
					<AnimatePresence initial={ false }>
						{ !! secondarySidebar && (
							<NavigableRegion
								className="interface-interface-skeleton__secondary-sidebar"
								ariaLabel={ mergedLabels.secondarySidebar }
								as={ motion.div }
								initial="closed"
								animate={
									isMobileViewport ? 'mobileOpen' : 'open'
								}
								exit="closed"
								variants={
									isZoomOutMode
										? secondarySidebarDiaglogVariants
										: secondarySidebarVariants
								}
								transition={ defaultTransition }
							>
								<div
									style={ {
										position: 'absolute',
										width: isMobileViewport
											? '100vw'
											: sidebarWidth,
										height: '100%',
										right: 0,
									} }
								>
									{ secondarySidebar }
								</div>
							</NavigableRegion>
						) }
					</AnimatePresence>
					{ !! notices && (
						<div className="interface-interface-skeleton__notices">
							{ notices }
						</div>
					) }
					<NavigableRegion
						className="interface-interface-skeleton__content"
						ariaLabel={ mergedLabels.body }
					>
						{ content }
					</NavigableRegion>
					{ !! sidebar && (
						<NavigableRegion
							className="interface-interface-skeleton__sidebar"
							ariaLabel={ mergedLabels.sidebar }
						>
							{ sidebar }
						</NavigableRegion>
					) }
					{ !! actions && (
						<NavigableRegion
							className="interface-interface-skeleton__actions"
							ariaLabel={ mergedLabels.actions }
						>
							{ actions }
						</NavigableRegion>
					) }
				</div>
			</div>
			{ !! footer && (
				<NavigableRegion
					className="interface-interface-skeleton__footer"
					ariaLabel={ mergedLabels.footer }
				>
					{ footer }
				</NavigableRegion>
			) }
		</div>
	);
}

export default forwardRef( InterfaceSkeleton );
