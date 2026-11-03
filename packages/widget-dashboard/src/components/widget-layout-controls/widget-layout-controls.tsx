import { __ } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of IconButton.
	IconButton,
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import type {
	DashboardWidget,
	DashboardWidthOption,
	GridTilePlacement,
} from '../../types';

type NamedGridWidth = Exclude<
	NonNullable< GridTilePlacement[ 'width' ] >,
	number
>;

export interface WidgetLayoutControlsProps {
	/**
	 * The instance these controls manage within the layout.
	 */
	widget: DashboardWidget< unknown >;

	/**
	 * Whether the policy allows removing the instance.
	 *
	 * @default true
	 */
	canRemove?: boolean;

	/**
	 * Whether the policy allows resizing the instance.
	 *
	 * @default true
	 */
	canResize?: boolean;
}

/**
 * Customize-mode controls: width menu and removal, each following the
 * policy's answer for its operation.
 *
 * The width menu offers the host's `widthOptions` when the dashboard
 * declares them, and the native 'use available width'/'make full width'
 * choices otherwise. With a failed width configuration the menu is not
 * offered at all: ungoverned choices are not restored to the consumer.
 *
 * @param {WidgetLayoutControlsProps} props Component props.
 */
export function WidgetLayoutControls( {
	widget,
	canRemove = true,
	canResize = true,
}: WidgetLayoutControlsProps ): React.ReactNode {
	const { layout, onLayoutChange, widthOptions } =
		useDashboardInternalContext();
	const width = widget.placement?.width;
	const widthChoices: readonly DashboardWidthOption[] | null =
		widthOptions.kind === 'custom' ? widthOptions.options : null;
	const offersWidthMenu = canResize && widthOptions.kind !== 'invalid';

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

	const onNamedWidthChange = ( nextWidth: NamedGridWidth ) => {
		updateWidth( nextWidth );
	};

	/*
	 * The stored token selects the radio verbatim; numeric tokens match
	 * on their string form. A stored width no choice covers (a legacy
	 * stored value) checks nothing, staying visible without a change.
	 */
	const onWidthOptionChange = ( nextValue: string ) => {
		const choice = widthChoices?.find(
			( option ) => String( option.value ) === nextValue
		);
		if ( choice ) {
			updateWidth( choice.value );
		}
	};

	const onRemove = () => {
		onLayoutChange(
			layout.filter(
				( currentWidget ) => currentWidget.uuid !== widget.uuid
			)
		);
	};

	return (
		<>
			{ offersWidthMenu && (
				<Menu.Root>
					<Menu.Trigger
						render={
							<IconButton
								icon={ moreVertical }
								label={ __( 'Widget options' ) }
								size="compact"
								variant="minimal"
								tone="neutral"
							/>
						}
					/>

					<Menu.Popup>
						{ widthChoices ? (
							<Menu.RadioGroup
								value={
									width === undefined ? null : String( width )
								}
								onValueChange={ onWidthOptionChange }
							>
								<Menu.GroupLabel>
									{ __( 'Width' ) }
								</Menu.GroupLabel>
								{ widthChoices.map( ( option ) => (
									<Menu.RadioItem
										key={ String( option.value ) }
										value={ String( option.value ) }
										closeOnClick
									>
										<Menu.ItemLabel>
											{ option.label }
										</Menu.ItemLabel>
									</Menu.RadioItem>
								) ) }
							</Menu.RadioGroup>
						) : (
							<Menu.RadioGroup
								value={ width ?? null }
								onValueChange={ onNamedWidthChange }
							>
								<Menu.GroupLabel>
									{ __( 'Width' ) }
								</Menu.GroupLabel>
								<Menu.RadioItem value="fill" closeOnClick>
									<Menu.ItemLabel>
										{ __( 'Use available width' ) }
									</Menu.ItemLabel>
								</Menu.RadioItem>
								<Menu.RadioItem value="full" closeOnClick>
									<Menu.ItemLabel>
										{ __( 'Make full width' ) }
									</Menu.ItemLabel>
								</Menu.RadioItem>
							</Menu.RadioGroup>
						) }
					</Menu.Popup>
				</Menu.Root>
			) }

			{ canRemove && (
				<IconButton
					icon={ trash }
					label={ __( 'Remove' ) }
					size="compact"
					variant="minimal"
					tone="neutral"
					onClick={ onRemove }
				/>
			) }
		</>
	);
}
