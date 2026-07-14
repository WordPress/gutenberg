/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useCallback, useMemo } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetSettingsTrigger } from '../widget-settings';
import { AttributeControlsDropdown } from './attribute-controls-dropdown';
import { useInlineControlsFit } from './use-inline-controls-fit';
import styles from './widget-attribute-controls.module.css';
import type { DashboardWidget, WidgetAttributes } from '../../types';

/*
 * Toolbar footprint of the settings trigger:
 * - a compact icon button (28px) (`--wpds-dimension-size-md`)
 * - a chip gap (8px)
 *
 * Reserved from the fit budget because the trigger stays in the toolbar in
 * both presentations.
 *
 * Todo: consider to compute the trigger reserve dynamically.
 */
const SETTINGS_TRIGGER_RESERVE = 28 + 8;

type WidgetAttributeControlsProps = {
	/**
	 * The instance whose attributes these controls edit.
	 */
	widget: DashboardWidget< unknown >;

	/**
	 * The instance's widget type, source of the attribute schema.
	 */
	widgetType: WidgetType;
};

/**
 * Normal-mode controls: the `relevance: 'high'` attributes on a prominent
 * surface, plus a settings entry point when needed.
 *
 * Inline controls appear only for the high-relevance fields; edits stage live
 * and auto-save on the dashboard's shared debounce.
 *
 * The inline presentation holds only while it fits the header.
 * When the fields' natural width exceeds the space the header can grant,
 * they unmount and collapse into a dropdown holding them as a form; the
 * settings trigger is not part of the collapse and stays in the toolbar.
 * While collapsed, the last measurement is retained to decide when to
 * expand back; remounting re-measures and re-collapses if the retained
 * value went stale.
 *
 * @param {WidgetAttributeControlsProps} props Component props.
 */
export function WidgetAttributeControls( {
	widget,
	widgetType,
}: WidgetAttributeControlsProps ): React.ReactNode {
	const { layout, onLayoutChange, scheduleAutoSave } =
		useDashboardInternalContext();

	const hasSettingsSurface = !! widgetType.attributes?.some(
		( attribute ) => attribute.relevance !== 'high'
	);
	const { measureRef, collapsed } = useInlineControlsFit(
		hasSettingsSurface ? SETTINGS_TRIGGER_RESERVE : 0
	);

	const fields = useMemo< Field< WidgetAttributes >[] >(
		() =>
			( widgetType.attributes ?? [] ).filter(
				( attribute ) => attribute.relevance === 'high'
			) as Field< WidgetAttributes >[],
		[ widgetType.attributes ]
	);

	// A `row` top-level layout lays the controls out horizontally; each field
	// carries `labelPosition: 'none'` so the control renders bare.
	const form = useMemo< Form >(
		() => ( {
			layout: { type: 'row', alignment: 'center' },
			fields: fields.map( ( field ) => ( {
				id: field.id,
				layout: { type: 'regular', labelPosition: 'none' },
			} ) ),
		} ),
		[ fields ]
	);

	const handleChange = useCallback(
		( edits: Record< string, unknown > ) => {
			onLayoutChange(
				layout.map( ( instance ) =>
					instance.uuid === widget.uuid
						? {
								...instance,
								attributes: {
									...( instance.attributes as object ),
									...edits,
								},
						  }
						: instance
				)
			);

			scheduleAutoSave();
		},
		[ layout, onLayoutChange, widget.uuid, scheduleAutoSave ]
	);

	const data = ( widget.attributes ??
		widgetType.example?.attributes ??
		{} ) as WidgetAttributes;

	return (
		<>
			{ ! collapsed ? (
				fields.length > 0 && (
					<Stack
						direction="row"
						align="center"
						gap="xs"
						ref={ measureRef }
						className={ styles[ 'inline-controls' ] }
					>
						<DataForm< WidgetAttributes >
							data={ data }
							fields={ fields }
							form={ form }
							onChange={ handleChange }
						/>
					</Stack>
				)
			) : (
				<AttributeControlsDropdown
					fields={ fields }
					data={ data }
					onChange={ handleChange }
				/>
			) }

			<WidgetSettingsTrigger
				widget={ widget }
				widgetType={ widgetType }
			/>
		</>
	);
}
