/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
import { forwardRef, useEffect } from '@wordpress/element';
import { __unstableUseNavigateRegions as useNavigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMergeRefs } from '@wordpress/compose';

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

function InterfaceSkeleton(
	{
		footer,
		header,
		sidebar,
		secondarySidebar,
		notices,
		content,
		drawer,
		actions,
		labels,
		className,
		shortcuts,
	},
	ref
) {
	const navigateRegionsProps = useNavigateRegions( shortcuts );

	useHTMLClass( 'interface-interface-skeleton__html-container' );

	const defaultLabels = {
		/* translators: accessibility text for the nav bar landmark region. */
		drawer: __( 'Drawer' ),
		/* translators: accessibility text for the top bar landmark region. */
		header: __( 'Header' ),
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
			{ ...navigateRegionsProps }
			ref={ useMergeRefs( [ ref, navigateRegionsProps.ref ] ) }
			className={ classnames(
				className,
				'interface-interface-skeleton',
				navigateRegionsProps.className,
				!! footer && 'has-footer'
			) }
		>
			{ !! drawer && (
				<div
					className="interface-interface-skeleton__drawer"
					role="region"
					aria-label={ mergedLabels.drawer }
					tabIndex="-1"
				>
					{ drawer }
				</div>
			) }
			<div className="interface-interface-skeleton__editor">
				{ !! header && (
					<div
						className="interface-interface-skeleton__header"
						role="region"
						aria-label={ mergedLabels.header }
						tabIndex="-1"
					>
						{ header }
					</div>
				) }
				<div className="interface-interface-skeleton__body">
					{ !! secondarySidebar && (
						<div
							className="interface-interface-skeleton__secondary-sidebar"
							role="region"
							aria-label={ mergedLabels.secondarySidebar }
							tabIndex="-1"
						>
							{ secondarySidebar }
						</div>
					) }
					{ !! notices && (
						<div className="interface-interface-skeleton__notices">
							{ notices }
						</div>
					) }
					<div
						className="interface-interface-skeleton__content"
						role="region"
						aria-label={ mergedLabels.body }
						tabIndex="-1"
					>
						{ content }
					</div>
					{ !! sidebar && (
						<div
							className="interface-interface-skeleton__sidebar"
							role="region"
							aria-label={ mergedLabels.sidebar }
							tabIndex="-1"
						>
							{ sidebar }
						</div>
					) }
					{ !! actions && (
						<div
							className="interface-interface-skeleton__actions"
							role="region"
							aria-label={ mergedLabels.actions }
							tabIndex="-1"
						>
							{ actions }
						</div>
					) }
				</div>
			</div>
			{ !! footer && (
				<div
					className="interface-interface-skeleton__footer"
					role="region"
					aria-label={ mergedLabels.footer }
					tabIndex="-1"
				>
					{ footer }
				</div>
			) }
		</div>
	);
}

export default forwardRef( InterfaceSkeleton );
