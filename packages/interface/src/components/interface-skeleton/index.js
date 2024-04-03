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
import { useMergeRefs, useReducedMotion } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import NavigableRegion from '../navigable-region';

const ANIMATION_DURATION = 0.2;

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

function InterfaceSkeleton(
	{
		isDistractionFree,
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
	const disableMotion = useReducedMotion();
	const navigateRegionsProps = useNavigateRegions( shortcuts );
	const defaultTransition = {
		type: 'tween',
		duration: disableMotion ? 0 : ANIMATION_DURATION,
		ease: 'easeOut',
	};

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
								initial={ { x: '-100%' } }
								animate={ { x: 0 } }
								exit={ { x: '-100%' } }
								transition={ defaultTransition }
							>
								{ secondarySidebar }
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
					<AnimatePresence initial={ false }>
						{ !! sidebar && (
							<NavigableRegion
								className="interface-interface-skeleton__sidebar"
								ariaLabel={ mergedLabels.sidebar }
								as={ motion.div }
								initial={ { x: '100%' } }
								animate={ { x: 0 } }
								exit={ { x: '100%' } }
								transition={ defaultTransition }
							>
								{ sidebar }
							</NavigableRegion>
						) }
					</AnimatePresence>
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
			<AnimatePresence initial={ false }>
				{ !! footer && (
					<NavigableRegion
						className="interface-interface-skeleton__footer"
						ariaLabel={ mergedLabels.footer }
						as={ motion.div }
						initial={ { y: '100%' } }
						animate={ { y: 0 } }
						exit={ { y: '100%' } }
						transition={ defaultTransition }
					>
						{ footer }
					</NavigableRegion>
				) }
			</AnimatePresence>
		</div>
	);
}

export default forwardRef( InterfaceSkeleton );
