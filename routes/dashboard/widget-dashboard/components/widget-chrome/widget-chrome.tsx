/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	Dropdown,
	MenuGroup,
	MenuItem,
	Spinner,
} from '@wordpress/components';
import {
	Component,
	Suspense,
	forwardRef,
	useCallback,
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
// Dashboard is still experimental.
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
	width?: number | 'fill' | 'full';
	onWidthChange: ( width: WidthMode ) => void;
}

type WidthMode = 'custom' | 'fill' | 'full';

const WIDTH_MODES: WidthMode[] = [ 'custom', 'fill', 'full' ];
const WIDTH_MODE_ICON = {
	custom: contents,
	fill: stretchWide,
	full: stretchFullWidth,
} as const;
const WIDTH_MODE_LABEL = {
	custom: __( 'Custom width' ),
	fill: __( 'Fill width' ),
	full: __( 'Full width' ),
} as const;

function Header( { titleId, widgetType, width, onWidthChange }: HeaderProps ) {
	if ( ! widgetType.title ) {
		return null;
	}
	const selectedWidthMode: WidthMode =
		typeof width === 'number' ? 'custom' : width ?? 'full';
	return (
		<Card.Header>
			<Stack direction="row" align="center" justify="space-between">
				<Stack direction="row" align="center" gap="sm">
					{ widgetType.icon && (
						<span
							className={ styles.widgetChromeHeaderIcon }
							aria-hidden="true"
						>
							<Icon icon={ widgetType.icon } />
						</span>
					) }
					<Card.Title id={ titleId } render={ <h3 /> }>
						{ widgetType.title }
					</Card.Title>
				</Stack>
				<Stack direction="row" align="center" gap="xs">
					<Dropdown
						popoverProps={ { placement: 'bottom-end' } }
						renderToggle={ ( { isOpen, onToggle } ) => (
							<IconButton
								icon={ WIDTH_MODE_ICON[ selectedWidthMode ] }
								label={ __( 'Widget width' ) }
								size="small"
								variant="minimal"
								tone="neutral"
								aria-expanded={ isOpen }
								onClick={ onToggle }
							/>
						) }
						renderContent={ ( { onClose } ) => (
							<MenuGroup>
								{ WIDTH_MODES.map( ( mode ) => (
									<MenuItem
										key={ mode }
										icon={ WIDTH_MODE_ICON[ mode ] }
										isSelected={
											selectedWidthMode === mode
										}
										onClick={ () => {
											onWidthChange( mode );
											onClose();
										} }
									>
										{ WIDTH_MODE_LABEL[ mode ] }
									</MenuItem>
								) ) }
							</MenuGroup>
						) }
					/>
					<IconButton
						icon={ trash }
						label={ __( 'Remove' ) }
						size="small"
						variant="minimal"
						tone="neutral"
					/>
				</Stack>
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
		const { widgetTypes, layout, onLayoutChange, editMode } =
			useDashboardInternalContext();
		const widgetType = widgetTypes.find( ( t ) => t.name === widget.type );
		const titleId = useId();
		const width = widget.placement?.width;

		const handleWidthChange = useCallback(
			( nextWidth: WidthMode ) => {
				const nextLayout = layout.map( ( currentWidget ) =>
					currentWidget.uuid === widget.uuid
						? {
								...currentWidget,
								placement: {
									...currentWidget.placement,
									width:
										nextWidth === 'custom' ? 1 : nextWidth,
								},
						  }
						: currentWidget
				);
				onLayoutChange( nextLayout );
			},
			[ layout, onLayoutChange, widget.uuid ]
		);

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
			<Header
				titleId={ titleId }
				widgetType={ widgetType }
				width={ width }
				onWidthChange={ handleWidthChange }
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
