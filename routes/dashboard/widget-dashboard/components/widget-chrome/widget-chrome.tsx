/**
 * External dependencies
 */
import clsx from 'clsx';
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
import { WidgetSettingsTrigger } from '../widget-settings';
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
	actions?: ReactNode;
}

function Header( { titleId, widgetType, actions }: HeaderProps ) {
	if ( ! widgetType.title && ! actions ) {
		return null;
	}

	return (
		<Card.Header>
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				gap="sm"
			>
				<Stack direction="row" align="center" gap="sm">
					{ widgetType.icon && (
						<span
							className={ styles.widgetChromeHeaderIcon }
							aria-hidden="true"
						>
							<WCIcon icon={ widgetType.icon } />
						</span>
					) }
					{ widgetType.title && (
						<Card.Title id={ titleId } render={ <h3 /> }>
							{ widgetType.title }
						</Card.Title>
					) }
				</Stack>
				{ actions && (
					<Stack className={ styles.widgetChromeHeaderActions }>
						{ actions }
					</Stack>
				) }
			</Stack>
		</Card.Header>
	);
}

export interface WidgetChromeProps {
	widget: DashboardWidget< unknown >;
	index: number;
	/**
	 * Lifted by the surrounding `@wordpress/grid` surface into a sibling
	 * slot of the grid item; not rendered by `WidgetChrome` itself.
	 * Living outside `Card.Root` is what keeps these controls interactive
	 * while edit mode applies `inert` to the chrome.
	 */
	actionableArea?: ReactNode;
	className?: string;
}

/**
 * Per-instance wrapper. Owns the chrome around a widget instance: identity
 * context, header (title + icon), edit-mode `inert` attribute, and the
 * error/loading boundaries that keep neighbours mounted when one widget fails
 * or is still resolving.
 */
export const WidgetChrome = forwardRef< HTMLDivElement, WidgetChromeProps >(
	function WidgetChrome( { widget, index, className }, ref ) {
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

		// Per-instance settings live in normal mode only: during a layout
		// edit the card is inert and the toolbar owns the staging buffer,
		// so the trigger stays hidden to keep the two flows from staging at
		// once.
		const hasSettings = ! editMode && !! widgetType.attributes?.length;

		const settingsControl = hasSettings ? (
			<WidgetSettingsTrigger
				widget={ widget }
				widgetType={ widgetType }
			/>
		) : null;

		const header = (
			<Header
				titleId={ titleId }
				widgetType={ widgetType }
				// Full-bleed types hide their header for visuals, so the
				// control floats over the body instead (see below) rather
				// than getting buried in the visually hidden header row.
				actions={ isFullBleed ? undefined : settingsControl }
			/>
		);
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
					className={ clsx( styles.widgetChrome, className ) }
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

					{ isFullBleed && settingsControl && (
						<Stack className={ styles.widgetChromeSettingsOverlay }>
							{ settingsControl }
						</Stack>
					) }
				</Card.Root>
			</WidgetContextProvider>
		);
	}
);
