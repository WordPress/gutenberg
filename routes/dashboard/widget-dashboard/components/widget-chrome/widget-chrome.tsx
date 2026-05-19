/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Icon as WCIcon, Spinner } from '@wordpress/components';
import {
	Component,
	Suspense,
	forwardRef,
	useId,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Card, Stack, Notice, VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetContextProvider } from '../../context/widget-context';
import { WidgetRender } from '../widget-render';
import styles from './widget-chrome.module.css';
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
				<Notice.Root intent="error">
					<Notice.Description>
						{ __( 'This widget encountered an error.' ) }
					</Notice.Description>
				</Notice.Root>
			);
		}
		return this.props.children;
	}
}

function LoadingOverlay() {
	return (
		<Stack justify="center" align="center" className={ styles.loading }>
			<Spinner />
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
		<Card.Header>
			<Stack direction="row" align="center" gap="sm">
				{ widgetType.icon && (
					<span
						className={ styles.widgetChromeHeaderIcon }
						aria-hidden="true"
					>
						<WCIcon icon={ widgetType.icon } />
					</span>
				) }
				<Card.Title id={ titleId } render={ <h3 /> }>
					{ widgetType.title }
				</Card.Title>
			</Stack>
		</Card.Header>
	);
}

export interface WidgetChromeProps {
	widget: DashboardWidget< unknown >;
	index: number;
}

/**
 * Per-instance wrapper. Owns the chrome around a widget instance: identity
 * context, header (title + icon), edit-mode `inert` attribute, and the
 * error/loading boundaries that keep neighbours mounted when one widget fails
 * or is still resolving.
 */
export const WidgetChrome = forwardRef< HTMLDivElement, WidgetChromeProps >(
	function WidgetChrome( { widget, index }, ref ) {
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

		const isFullBleed = widgetType.presentation === 'full-bleed';
		const header = <Header titleId={ titleId } widgetType={ widgetType } />;
		const body = (
			<WidgetErrorBoundary>
				<Suspense fallback={ <LoadingOverlay /> }>
					<WidgetRender widget={ widget } widgetType={ widgetType } />
				</Suspense>
			</WidgetErrorBoundary>
		);

		return (
			<WidgetContextProvider value={ contextValue }>
				<Card.Root
					render={ <section /> }
					ref={ ref }
					className={ styles.widgetChrome }
					aria-labelledby={ widgetType.title ? titleId : undefined }
					{ ...( editMode ? { inert: '' } : {} ) }
				>
					{ isFullBleed ? (
						<VisuallyHidden>{ header }</VisuallyHidden>
					) : (
						header
					) }

					<Card.Content className={ styles.widgetChromeContent }>
						{ isFullBleed ? (
							<Card.FullBleed
								className={
									styles.widgetChromeContentFullBleed
								}
							>
								{ body }
							</Card.FullBleed>
						) : (
							body
						) }
					</Card.Content>
				</Card.Root>
			</WidgetContextProvider>
		);
	}
);
