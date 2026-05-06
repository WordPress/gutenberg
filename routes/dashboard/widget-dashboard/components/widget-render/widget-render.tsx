/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Component, Suspense, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { getLazyWidgetComponent } from '../../utils/get-lazy-widget-component';
import styles from './widget-render.module.css';
import type { DashboardWidget, WidgetType } from '../../types';

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

class WidgetErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<Stack
					direction="column"
					justify="center"
					align="center"
					className={ styles.error }
					role="alert"
				>
					<p>{ __( 'This widget encountered an error.' ) }</p>
				</Stack>
			);
		}
		return this.props.children;
	}
}

function LoadingOverlay() {
	return (
		<Stack justify="center" align="center" className={ styles.loading }>
			<span>{ __( 'Loading…' ) }</span>
		</Stack>
	);
}

interface WidgetRenderInternalProps {
	widget: DashboardWidget< unknown >;
	widgetType: WidgetType;
}

function WidgetRenderImpl( { widget, widgetType }: WidgetRenderInternalProps ) {
	const { layout, onLayoutChange, resolveWidgetModule } =
		useDashboardInternalContext();

	const WidgetComponent = getLazyWidgetComponent(
		widgetType.renderModule,
		resolveWidgetModule
	);

	const setAttributes = useCallback(
		( next: Partial< unknown > ) => {
			onLayoutChange(
				layout.map( ( w ) =>
					w.uuid === widget.uuid
						? {
								...w,
								attributes: {
									...( w.attributes as object ),
									...( next as object ),
								},
						  }
						: w
				)
			);
		},
		[ widget.uuid, layout, onLayoutChange ]
	);

	return (
		<WidgetErrorBoundary>
			<Suspense fallback={ <LoadingOverlay /> }>
				{ /* WidgetComponent is a cached `lazy()` keyed by renderModule, so its identity stays stable across renders. */ }
				{ /* eslint-disable-next-line react-hooks/static-components */ }
				<WidgetComponent
					attributes={ widget.attributes }
					setAttributes={ setAttributes }
				/>
			</Suspense>
		</WidgetErrorBoundary>
	);
}

/**
 * Lazy-loads a widget's render module via the configured resolver and renders
 * it with the minimal `WidgetRenderProps` contract: `attributes` plus
 * `setAttributes`. Wraps the module in a `Suspense` boundary and an error
 * boundary so neighbours stay mounted if one widget fails.
 *
 * Kept internal to the package. Surfaces that want bare widget rendering
 * should compose `WidgetDashboard.Widget` instead.
 */
export const WidgetRender = WidgetRenderImpl;
