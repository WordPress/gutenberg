/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import styles from './widget-chrome-actionable-area.module.css';
import type { DashboardWidget, GridTilePlacement } from '../../types';

const { Menu } = unlock( componentsPrivateApis );

const COLUMN_SPAN_RADIO_NAME = 'widget-column-span';
const NAMED_WIDTH_RADIO_NAME = 'widget-named-width';

type NamedGridWidth = Exclude<
	NonNullable< GridTilePlacement[ 'width' ] >,
	number
>;

function getColumnSpanLabel( span: number, gridColumns: number ): string {
	return sprintf(
		/* translators: 1: column span, 2: total columns in the grid layout. */
		_n( '%1$d/%2$d column', '%1$d/%2$d columns', gridColumns ),
		span,
		gridColumns
	);
}

interface WidgetChromeActionsProps {
	width: GridTilePlacement[ 'width' ];
	gridColumns: number;
	onColumnSpanChange: ( span: number ) => void;
	onNamedWidthChange: ( width: NamedGridWidth ) => void;
	onRemove: () => void;
}

function WidgetChromeActions( {
	width,
	gridColumns,
	onColumnSpanChange,
	onNamedWidthChange,
	onRemove,
}: WidgetChromeActionsProps ) {
	const selectedColumnSpan =
		typeof width === 'number'
			? Math.max( 1, Math.min( width, gridColumns ) )
			: null;

	const columnSpans = Array.from(
		{ length: gridColumns },
		( _, index ) => index + 1
	);

	return (
		<Stack direction="row" align="center" gap="sm">
			<Menu>
				<Menu.TriggerButton
					render={
						<IconButton
							icon={ moreVertical }
							label={ __( 'Widget options' ) }
							size="small"
							variant="minimal"
							tone="neutral"
						/>
					}
				/>
				<Menu.Popover>
					<Menu>
						<Menu.SubmenuTriggerItem
							suffix={
								selectedColumnSpan !== null
									? getColumnSpanLabel(
											selectedColumnSpan,
											gridColumns
									  )
									: undefined
							}
						>
							<Menu.ItemLabel>
								{ __( 'Fixed width' ) }
							</Menu.ItemLabel>
						</Menu.SubmenuTriggerItem>
						<Menu.Popover>
							<Menu.Group>
								{ columnSpans.map( ( span ) => (
									<Menu.RadioItem
										key={ span }
										name={ COLUMN_SPAN_RADIO_NAME }
										value={ String( span ) }
										checked={ selectedColumnSpan === span }
										onChange={ () =>
											onColumnSpanChange( span )
										}
									>
										<Menu.ItemLabel>
											{ getColumnSpanLabel(
												span,
												gridColumns
											) }
										</Menu.ItemLabel>
									</Menu.RadioItem>
								) ) }
							</Menu.Group>
						</Menu.Popover>
					</Menu>
					<Menu.RadioItem
						name={ NAMED_WIDTH_RADIO_NAME }
						value="fill"
						checked={ width === 'fill' }
						onChange={ () => onNamedWidthChange( 'fill' ) }
					>
						<Menu.ItemLabel>
							{ __( 'Fill available width' ) }
						</Menu.ItemLabel>
					</Menu.RadioItem>
					<Menu.RadioItem
						name={ NAMED_WIDTH_RADIO_NAME }
						value="full"
						checked={ width === 'full' }
						onChange={ () => onNamedWidthChange( 'full' ) }
					>
						<Menu.ItemLabel>{ __( 'Full width' ) }</Menu.ItemLabel>
					</Menu.RadioItem>
				</Menu.Popover>
			</Menu>
			<IconButton
				icon={ trash }
				label={ __( 'Remove' ) }
				size="small"
				variant="minimal"
				tone="neutral"
				onClick={ onRemove }
			/>
		</Stack>
	);
}

interface WidgetChromeActionableAreaProps {
	widget: DashboardWidget< unknown >;
}

export function WidgetChromeActionableArea( {
	widget,
}: WidgetChromeActionableAreaProps ) {
	const { layout, onLayoutChange, gridSettings } =
		useDashboardInternalContext();
	const gridColumns = gridSettings.columns;
	const width = widget.placement?.width;

	const updateWidth = ( nextWidth: GridTilePlacement[ 'width' ] ) => {
		const nextLayout = layout.map( ( currentWidget ) =>
			currentWidget.uuid === widget.uuid
				? {
						...currentWidget,
						placement: {
							...currentWidget.placement,
							width: nextWidth,
						},
				  }
				: currentWidget
		);
		onLayoutChange( nextLayout );
	};

	const onColumnSpanChange = ( span: number ) => {
		updateWidth( span );
	};

	const onNamedWidthChange = ( nextWidth: NamedGridWidth ) => {
		updateWidth( nextWidth );
	};

	const onRemove = () => {
		onLayoutChange(
			layout.filter(
				( currentWidget ) => currentWidget.uuid !== widget.uuid
			)
		);
	};

	return (
		<div className={ styles.widgetChromeActionableArea }>
			<WidgetChromeActions
				width={ width }
				gridColumns={ gridColumns }
				onColumnSpanChange={ onColumnSpanChange }
				onNamedWidthChange={ onNamedWidthChange }
				onRemove={ onRemove }
			/>
		</div>
	);
}
