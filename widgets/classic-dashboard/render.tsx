/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useRefEffect } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
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
		<>
			{ ! isLoaded && (
				<Stack
					align="center"
					justify="center"
					className={ styles.loading }
				>
					<Spinner />
				</Stack>
			) }
			<div
				className={
					isLoaded
						? styles.classicDashboardWidget
						: `${ styles.classicDashboardWidget } ${ styles.isOffscreen }`
				}
			>
				<iframe
					ref={ resizeRef }
					className={ styles.classicDashboardWidgetIframe }
					title={ __( 'Classic dashboard widget preview' ) }
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
