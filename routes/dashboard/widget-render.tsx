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
import { useDashboardInternalContext } from './dashboard-context';
import styles from './widget-dashboard.module.css';
import type {
	WidgetInstance,
	WidgetModule,
	WidgetRenderProps,
	WidgetType,
} from './types';

function isValidWidgetModule( module: unknown ): module is WidgetModule {
	return (
		typeof module === 'object' &&
		module !== null &&
		'default' in module &&
		typeof ( module as { default: unknown } ).default === 'function'
	);
}

interface ErrorBoundaryProps {
	onError?: ( error: Error ) => void;
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

	componentDidCatch( error: Error ) {
		this.props.onError?.( error );
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
	widget: WidgetInstance< unknown >;
	widgetType: WidgetType;
}

/**
 * Lazy-loads a widget's render module via the configured resolver and renders
 * it with the minimal `WidgetRenderProps` contract: `attributes` plus
 * `setAttributes`. Wraps the module in a `Suspense` boundary and an error
 * boundary so neighbours stay mounted if one widget fails.
 *
 * Kept internal to the package. Surfaces that want bare widget rendering
 * should compose `WidgetDashboard.Widget` instead.
 * @param root0
 * @param root0.widget
 * @param root0.widgetType
 */
export function WidgetRender( {
	widget,
	widgetType,
}: WidgetRenderInternalProps ) {
	const { layout, onLayoutChange, resolveWidgetModule, onWidgetError } =
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

	const handleError = useCallback(
		( error: Error ) => {
			onWidgetError?.( widget.uuid, {
				message: error.message,
			} );
		},
		[ widget.uuid, onWidgetError ]
	);

	return (
		<WidgetErrorBoundary onError={ handleError }>
			<Suspense fallback={ <LoadingOverlay /> }>
				<WidgetComponent
					attributes={ widget.attributes }
					setAttributes={ setAttributes }
				/>
			</Suspense>
		</WidgetErrorBoundary>
	);
}
