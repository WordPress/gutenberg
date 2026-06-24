/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import {
	Component,
	Suspense,
	forwardRef,
	useId,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Card, Icon, Stack, Notice, Text, VisuallyHidden } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetContextProvider } from '../../context/widget-context';
import { WidgetRender } from '../widget-render';
import styles from './widget-chrome.module.css';
import type { DashboardWidget } from '../../types';

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

interface UnavailableWidgetProps {
	widgetTypeName: string;
}

function UnavailableWidget( { widgetTypeName }: UnavailableWidgetProps ) {
	return (
		<>
			<Card.Header>
				<span
					className={ styles.widgetChromeHeaderIcon }
					aria-hidden="true"
				>
					<Icon icon={ plugins } />
				</span>
			</Card.Header>
			<Card.Content className={ styles.widgetChromeContent }>
				<Stack
					direction="column"
					justify="center"
					align="center"
					gap="md"
					className={ styles.unavailable }
				>
					<Text>{ __( 'Widget is no longer available.' ) }</Text>
					<Text render={ <code /> }>{ widgetTypeName }</Text>
				</Stack>
			</Card.Content>
		</>
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
						<Icon icon={ widgetType.icon } />
					</span>
				) }
				<Card.Title id={ titleId } render={ <h2 /> }>
					{ widgetType.title }
				</Card.Title>
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
		const { widgetTypes, isResolvingWidgetTypes, editMode } =
			useDashboardInternalContext();
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
			if ( isResolvingWidgetTypes ) {
				return (
					<WidgetContextProvider value={ contextValue }>
						<Card.Root
							render={ <section /> }
							ref={ ref }
							className={ clsx( styles.widgetChrome, className ) }
							aria-busy="true"
							aria-label={ __( 'Loading' ) }
						>
							<Card.Content
								className={ styles.widgetChromeContent }
							>
								<LoadingOverlay />
							</Card.Content>
						</Card.Root>
					</WidgetContextProvider>
				);
			}

			return (
				<WidgetContextProvider value={ contextValue }>
					<Card.Root
						render={ <section /> }
						ref={ ref }
						className={ clsx( styles.widgetChrome, className ) }
						aria-label={ __( 'Missing widget' ) }
					>
						<UnavailableWidget widgetTypeName={ widget.type } />
					</Card.Root>
				</WidgetContextProvider>
			);
		}

		// `presentation` encodes two independent axes. `full-bleed` hides
		// the header; both `full-bleed` and `content-bleed` let the body
		// break out of the content padding.
		const { presentation } = widgetType;
		const isHeaderHidden = presentation === 'full-bleed';
		const isBodyBleeding =
			presentation === 'full-bleed' || presentation === 'content-bleed';
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
					className={ clsx( styles.widgetChrome, className ) }
					aria-labelledby={ widgetType.title ? titleId : undefined }
					{ ...( editMode ? { inert: 'true' } : {} ) }
				>
					{ isHeaderHidden ? (
						<VisuallyHidden>{ header }</VisuallyHidden>
					) : (
						header
					) }

					<Card.Content
						className={ clsx(
							styles.widgetChromeContent,
							isBodyBleeding && styles.widgetChromeContentBleed
						) }
					>
						{ isBodyBleeding ? (
							<Card.FullBleed
								className={ styles.widgetChromeBleedScroll }
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
