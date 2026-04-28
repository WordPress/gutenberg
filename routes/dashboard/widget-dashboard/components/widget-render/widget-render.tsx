/**
 * External dependencies
 */
import type { ComponentType, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	Component,
	Suspense,
	lazy,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import styles from './widget-render.module.css';
import type {
	DashboardWidget,
	WidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '../../types';

function isValidWidgetModule( module: unknown ): module is WidgetModule {
	return (
		typeof module === 'object' &&
		module !== null &&
		'default' in module &&
		typeof ( module as { default: unknown } ).default === 'function'
	);
}

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
				<div className={ styles.error } role="alert">
					<p>{ __( 'This widget encountered an error.' ) }</p>
				</div>
			);
		}
		return this.props.children;
	}
}

function LoadingOverlay() {
	return (
		<div className={ styles.loading }>
			<span>{ __( 'Loading…' ) }</span>
		</div>
	);
}

interface WidgetRenderInternalProps {
	widget: DashboardWidget< unknown >;
	widgetType: WidgetType;
}

function WidgetRenderImpl( { widget, widgetType }: WidgetRenderInternalProps ) {
	const { layout, onLayoutChange, resolveWidgetModule } =
		useDashboardInternalContext();

	const WidgetComponent = useMemo(
		() =>
			lazy< ComponentType< WidgetRenderProps< unknown > > >( async () => {
				const module: unknown = await resolveWidgetModule(
					widgetType.renderModule
				);
				if ( ! isValidWidgetModule( module ) ) {
					throw new Error(
						`Invalid widget module: ${ widgetType.renderModule }`
					);
				}
				return module;
			} ),
		[ widgetType.renderModule, resolveWidgetModule ]
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
