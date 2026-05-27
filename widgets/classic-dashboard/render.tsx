/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useRefEffect } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import styles from './render.module.css';

export interface ClassicDashboardWidgetAttributes {
	classicId: string;
}

interface ClassicDashboardWidgetRenderProps {
	attributes: ClassicDashboardWidgetAttributes;
	setAttributes?: (
		next: Partial< ClassicDashboardWidgetAttributes >
	) => void;
}

function getPreviewUrl( classicId: string ): string {
	return addQueryArgs( window.location.pathname, {
		'dashboard-classic-widget-preview': classicId,
	} );
}

function measureIframeContentHeight( iframe: HTMLIFrameElement ): number {
	const doc = iframe.contentDocument;
	if ( ! doc ) {
		return 0;
	}

	const postbox = doc.querySelector( '.postbox' );
	if ( postbox ) {
		return postbox.getBoundingClientRect().height;
	}

	return Math.max(
		doc.documentElement?.scrollHeight ?? 0,
		doc.body?.scrollHeight ?? 0
	);
}

/**
 * Renders a classic `wp_add_dashboard_widget()` registration via an admin
 * iframe so plugin scripts and styles can load normally.
 *
 * @param {ClassicDashboardWidgetRenderProps} root0            Component props.
 * @param {ClassicDashboardWidgetAttributes}  root0.attributes Dashboard widget instance attributes.
 * @return Rendered iframe preview.
 */
export default function ClassicDashboardWidgetRender( {
	attributes,
}: ClassicDashboardWidgetRenderProps ) {
	const classicId = attributes?.classicId;
	const [ isLoaded, setIsLoaded ] = useState( false );

	const resizeRef = useRefEffect(
		( iframe: HTMLIFrameElement ) => {
			if ( ! isLoaded ) {
				return;
			}

			const parentElement = iframe.parentElement;
			if ( ! parentElement ) {
				return;
			}

			const container: HTMLElement = parentElement;

			const ownerView = iframe.ownerDocument.defaultView;
			if ( ! ownerView?.IntersectionObserver ) {
				return;
			}

			function syncIframeHeight() {
				const containerHeight = container.clientHeight;
				const contentHeight = measureIframeContentHeight( iframe );
				const height = Math.max( containerHeight, contentHeight );

				iframe.style.height = `${
					height > 0 ? height : containerHeight
				}px`;
			}

			const resizeObserver = new ResizeObserver( () => {
				syncIframeHeight();
			} );
			resizeObserver.observe( container );

			const intersectionObserver = new ownerView.IntersectionObserver(
				( entries: IntersectionObserverEntry[] ) => {
					const entry = entries[ 0 ];
					if ( entry?.isIntersecting ) {
						syncIframeHeight();
					}
				},
				{ threshold: 0 }
			);
			intersectionObserver.observe( iframe );

			iframe.addEventListener( 'load', syncIframeHeight );
			syncIframeHeight();

			return () => {
				resizeObserver.disconnect();
				intersectionObserver.disconnect();
				iframe.removeEventListener( 'load', syncIframeHeight );
			};
		},
		[ isLoaded ]
	);

	if ( ! classicId ) {
		return (
			<Stack
				align="center"
				justify="center"
				className={ styles.classicDashboardWidget }
			>
				<Text>
					{ __( 'Classic dashboard widget is missing an id.' ) }
				</Text>
			</Stack>
		);
	}

	const previewUrl = getPreviewUrl( classicId );

	return (
		<Card.FullBleed
			className={
				isLoaded
					? styles.classicDashboardWidget
					: `${ styles.classicDashboardWidget } ${ styles.isOffscreen }`
			}
		>
			{ ! isLoaded && (
				<Stack
					align="center"
					justify="center"
					className={ styles.loading }
				>
					<Spinner />
				</Stack>
			) }
			<iframe
				ref={ resizeRef }
				className={ styles.classicDashboardWidgetIframe }
				title={ __( 'Classic dashboard widget preview' ) }
				src={ previewUrl }
				tabIndex={ -1 }
				onLoad={ () => {
					setIsLoaded( true );
				} }
			/>
		</Card.FullBleed>
	);
}
