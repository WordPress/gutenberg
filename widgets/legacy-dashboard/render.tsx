/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { Placeholder, Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import styles from './render.module.css';

export interface LegacyDashboardWidgetAttributes {
	legacyId: string;
}

interface LegacyDashboardWidgetRenderProps {
	attributes: LegacyDashboardWidgetAttributes;
	setAttributes?: (
		next: Partial< LegacyDashboardWidgetAttributes >
	) => void;
}

function getPreviewUrl( legacyId: string ): string {
	return addQueryArgs(
		{
			'dashboard-legacy-widget-preview': legacyId,
		},
		window.location.pathname
	);
}

/**
 * Renders a classic `wp_add_dashboard_widget()` registration via an admin
 * iframe so plugin scripts and styles can load normally.
 *
 * @param {LegacyDashboardWidgetRenderProps} root0            Component props.
 * @param {LegacyDashboardWidgetAttributes}  root0.attributes Dashboard widget instance attributes.
 * @return Rendered iframe preview.
 */
export default function LegacyDashboardWidgetRender( {
	attributes,
}: LegacyDashboardWidgetRenderProps ) {
	const legacyId = attributes?.legacyId;
	const [ isLoaded, setIsLoaded ] = useState( false );

	const resizeRef = useRefEffect(
		( iframe: HTMLIFrameElement ) => {
			if ( ! isLoaded ) {
				return;
			}

			function setHeight() {
				const doc = iframe.contentDocument;
				if ( ! doc ) {
					return;
				}

				const height = Math.max(
					doc.documentElement?.offsetHeight ?? 0,
					doc.body?.offsetHeight ?? 0
				);

				iframe.style.height = `${ height !== 0 ? height : 100 }px`;
			}

			const { IntersectionObserver } = iframe.ownerDocument.defaultView;

			const intersectionObserver = new IntersectionObserver(
				( [ entry ] ) => {
					if ( entry.isIntersecting ) {
						setHeight();
					}
				},
				{ threshold: 1 }
			);
			intersectionObserver.observe( iframe );
			iframe.addEventListener( 'load', setHeight );

			return () => {
				intersectionObserver.disconnect();
				iframe.removeEventListener( 'load', setHeight );
			};
		},
		[ isLoaded ]
	);

	if ( ! legacyId ) {
		return (
			<Placeholder>
				{ __( 'Legacy dashboard widget is missing an id.' ) }
			</Placeholder>
		);
	}

	const previewUrl = getPreviewUrl( legacyId );

	return (
		<>
			{ ! isLoaded && (
				<Placeholder>
					<Spinner />
				</Placeholder>
			) }
			<div
				className={
					isLoaded
						? styles.legacyDashboardWidget
						: `${ styles.legacyDashboardWidget } ${ styles.isOffscreen }`
				}
			>
				<iframe
					ref={ resizeRef }
					className={ styles.legacyDashboardWidgetIframe }
					title={ __( 'Legacy dashboard widget preview' ) }
					src={ previewUrl }
					tabIndex={ -1 }
					onLoad={ ( event ) => {
						const target = event.target as HTMLIFrameElement;
						if ( target.contentDocument?.body ) {
							target.contentDocument.body.style.overflow =
								'hidden';
						}
						setIsLoaded( true );
					} }
					height={ 100 }
				/>
			</div>
		</>
	);
}
