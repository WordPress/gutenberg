/**
 * External dependencies
 */
import clsx from 'clsx';

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
	useResizeObserver,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import NavigableRegion from '../navigable-region';

const ANIMATION_DURATION = 0.25;
const commonTransition = {
	type: 'tween',
	duration: ANIMATION_DURATION,
	ease: [ 0.6, 0, 0.4, 1 ],
};

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
	hidden: { opacity: 1, marginTop: -60 },
	visible: { opacity: 1, marginTop: 0 },
	distractionFreeHover: {
		opacity: 1,
		marginTop: 0,
		transition: {
			...commonTransition,
			delay: 0.2,
			delayChildren: 0.2,
		},
	},
	distractionFreeHidden: {
		opacity: 0,
		marginTop: -60,
	},
	distractionFreeDisabled: {
		opacity: 0,
		marginTop: 0,
		transition: {
			...commonTransition,
			delay: 0.8,
			delayChildren: 0.8,
		},
	},
};

function InterfaceSkeleton(
	{
		isDistractionFree,
		footer,
		header,
		editorNotices,
		sidebar,
		secondarySidebar,
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
	const [ secondarySidebarResizeListener, secondarySidebarSize ] =
		useResizeObserver();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const disableMotion = useReducedMotion();
	const defaultTransition = {
		type: 'tween',
		duration: disableMotion ? 0 : ANIMATION_DURATION,
		ease: [ 0.6, 0, 0.4, 1 ],
	};
	const navigateRegionsProps = useNavigateRegions( shortcuts );
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
			className={ clsx(
				className,
				'interface-interface-skeleton',
				navigateRegionsProps.className,
				!! footer && 'has-footer'
			) }
		>
			<div className="interface-interface-skeleton__editor">
				<AnimatePresence initial={ false }>
					{ !! header && (
						<NavigableRegion
							as={ motion.div }
							className="interface-interface-skeleton__header"
							aria-label={ mergedLabels.header }
							initial={
								isDistractionFree
									? 'distractionFreeHidden'
									: 'hidden'
							}
							whileHover={
								isDistractionFree
									? 'distractionFreeHover'
									: 'visible'
							}
							animate={
								isDistractionFree
									? 'distractionFreeDisabled'
									: 'visible'
							}
							exit={
								isDistractionFree
									? 'distractionFreeHidden'
									: 'hidden'
							}
							variants={ headerVariants }
							transition={ defaultTransition }
						>
							{ header }
						</NavigableRegion>
					) }
				</AnimatePresence>
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
								animate="open"
								exit="closed"
								variants={ {
									open: { width: secondarySidebarSize.width },
									closed: { width: 0 },
								} }
								transition={ defaultTransition }
							>
								<motion.div
									style={ {
										position: 'absolute',
										width: isMobileViewport
											? '100vw'
											: 'fit-content',
										height: '100%',
										left: 0,
									} }
									variants={ {
										open: { x: 0 },
										closed: { x: '-100%' },
									} }
									transition={ defaultTransition }
								>
									{ secondarySidebarResizeListener }
									{ secondarySidebar }
								</motion.div>
							</NavigableRegion>
						) }
					</AnimatePresence>
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
