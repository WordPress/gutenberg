/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	Icon as WCIcon,
	privateApis as componentsPrivateApis,
	Spinner,
} from '@wordpress/components';
import {
	Component,
	Suspense,
	forwardRef,
	useId,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	contents,
	stretchFullWidth,
	stretchWide,
	trash,
} from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import {
	Card,
	Icon,
	IconButton,
	Stack,
	Notice,
	VisuallyHidden,
} from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetContextProvider } from '../../context/widget-context';
import { WidgetRender } from '../widget-render';
import styles from './widget-chrome.module.css';
import type {
	DashboardWidget,
	GridTilePlacement,
	WidgetType,
} from '../../types';

const { Menu } = unlock( componentsPrivateApis );

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

type NamedGridWidth = Exclude<
	NonNullable< GridTilePlacement[ 'width' ] >,
	number
>;
type WidthMode = 'custom' | NamedGridWidth;

const WIDTH_MODES: WidthMode[] = [ 'custom', 'fill', 'full' ];
const WIDTH_MODE_ICON = {
	custom: contents,
	fill: stretchWide,
	full: stretchFullWidth,
} as const;

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
	actionableArea?: ReactNode;
	className?: string;
	tabIndex?: number;
}

interface WidgetChromeActionableAreaProps {
	widget: DashboardWidget< unknown >;
}

interface HeaderActionsProps {
	selectedWidthMode: WidthMode;
	onWidthChange: ( width: WidthMode ) => void;
}

function HeaderActions( {
	selectedWidthMode,
	onWidthChange,
}: HeaderActionsProps ) {
	const widthModeLabel: Record< WidthMode, string > = {
		custom: __( 'Custom width' ),
		fill: __( 'Fill width' ),
		full: __( 'Full width' ),
	};

	return (
		<Stack direction="row" align="center" gap="sm">
			<Menu>
				<Menu.TriggerButton
					render={
						<IconButton
							icon={ WIDTH_MODE_ICON[ selectedWidthMode ] }
							label={ __( 'Widget width' ) }
							size="small"
							variant="minimal"
							tone="neutral"
						/>
					}
				/>
				<Menu.Popover>
					<Menu.Group>
						{ WIDTH_MODES.map( ( mode ) => (
							<Menu.Item
								key={ mode }
								prefix={
									<Icon icon={ WIDTH_MODE_ICON[ mode ] } />
								}
								disabled={ selectedWidthMode === mode }
								onClick={ () => onWidthChange( mode ) }
							>
								<Menu.ItemLabel>
									{ widthModeLabel[ mode ] }
								</Menu.ItemLabel>
							</Menu.Item>
						) ) }
					</Menu.Group>
				</Menu.Popover>
			</Menu>
			<IconButton
				icon={ trash }
				label={ __( 'Remove' ) }
				size="small"
				variant="minimal"
				tone="neutral"
			/>
		</Stack>
	);
}

export function WidgetChromeActionableArea( {
	widget,
}: WidgetChromeActionableAreaProps ) {
	const { layout, onLayoutChange } = useDashboardInternalContext();
	const selectedWidthMode: WidthMode =
		typeof widget.placement?.width === 'number'
			? 'custom'
			: widget.placement?.width ?? 'full';

	const onWidthChange = ( nextWidth: WidthMode ) => {
		const nextLayout = layout.map( ( currentWidget ) =>
			currentWidget.uuid === widget.uuid
				? {
						...currentWidget,
						placement: {
							...currentWidget.placement,
							width: nextWidth === 'custom' ? 1 : nextWidth,
						},
				  }
				: currentWidget
		);
		onLayoutChange( nextLayout );
	};

	return (
		<div className={ styles.widgetChromeActionableArea }>
			<HeaderActions
				selectedWidthMode={ selectedWidthMode }
				onWidthChange={ onWidthChange }
			/>
		</div>
	);
}

/**
 * Per-instance wrapper. Owns the chrome around a widget instance: identity
 * context, header (title + icon), edit-mode `inert` attribute, and the
 * error/loading boundaries that keep neighbours mounted when one widget fails
 * or is still resolving.
 */
export const WidgetChrome = forwardRef< HTMLDivElement, WidgetChromeProps >(
	function WidgetChrome( { widget, index, className, tabIndex }, ref ) {
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
		const header = (
			<Header titleId={ titleId } widgetType={ widgetType } />
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
					tabIndex={ tabIndex }
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
