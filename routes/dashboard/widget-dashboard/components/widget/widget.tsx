/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import {
	Component,
	Suspense,
	forwardRef,
	useId,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetContextProvider } from '../../context/widget-context';
import { WidgetRender } from '../widget-render';
import styles from './widget.module.css';
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

interface HeaderProps {
	titleId: string;
	widgetType: WidgetType;
}

function Header( { titleId, widgetType }: HeaderProps ) {
	if ( ! widgetType.title ) {
		return null;
	}
	return (
		<Stack
			direction="row"
			align="center"
			gap="sm"
			className={ styles.header }
		>
			{ widgetType.icon && (
				<span className={ styles.headerIcon } aria-hidden="true">
					<Icon icon={ widgetType.icon } />
				</span>
			) }
			<h3 id={ titleId } className={ styles.headerTitle }>
				{ widgetType.title }
			</h3>
		</Stack>
	);
}

export interface WidgetProps {
	widget: DashboardWidget< unknown >;
	index: number;
}

/**
 * Per-instance wrapper. Owns the chrome around a widget instance: identity
 * context, header (title + icon), edit-mode `inert` attribute, and the
 * error/loading boundaries that keep neighbours mounted when one widget fails
 * or is still resolving.
 */
export const Widget = forwardRef< HTMLDivElement, WidgetProps >(
	function Widget( { widget, index }, ref ) {
		const { widgetTypes, editMode } = useDashboardInternalContext();
		const widgetType = widgetTypes.find( ( t ) => t.name === widget.type );
		const titleId = useId();

		const contextValue = useMemo(
			() => ( {
				uuid: widget.uuid,
				name: widget.type,
				index,
			} ),
			[ widget.uuid, widget.type, index ]
		);

		if ( ! widgetType ) {
			return null;
		}

		return (
			<WidgetContextProvider value={ contextValue }>
				<section
					ref={ ref }
					className={ styles.widget }
					aria-labelledby={ widgetType.title ? titleId : undefined }
					{ ...( editMode ? { inert: '' } : {} ) }
				>
					<Header titleId={ titleId } widgetType={ widgetType } />
					<WidgetErrorBoundary>
						<Suspense fallback={ <LoadingOverlay /> }>
							<WidgetRender
								widget={ widget }
								widgetType={ widgetType }
							/>
						</Suspense>
					</WidgetErrorBoundary>
				</section>
			</WidgetContextProvider>
		);
	}
);
