/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useCallback, useMemo } from '@wordpress/element';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetSettingsTrigger } from '../widget-settings';
import { AttributeControlsDropdown } from './attribute-controls-dropdown';
import { useInlineControlsFit } from './use-inline-controls-fit';
import styles from './widget-attribute-controls.module.css';
import type { DashboardWidget } from '../../types';

type WidgetAttributes = Record< string, unknown >;

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
 * surface, plus a settings entry point when needed. Inline controls appear
 * only for the high-relevance fields; edits stage live and auto-save on the
 * dashboard's shared debounce.
 *
 * The inline presentation holds only while it fits the header. When its
 * natural width exceeds the space the header can grant, the fields collapse
 * behind the settings trigger, whose dropdown holds them as a form; the
 * inline controls stay mounted, hidden and inert, so the fit keeps being
 * measured and the presentation can expand back.
 *
 * @param {WidgetAttributeControlsProps} props Component props.
 */
export function WidgetAttributeControls( {
	widget,
	widgetType,
}: WidgetAttributeControlsProps ): React.ReactNode {
	const { layout, onLayoutChange, scheduleAutoSave } =
		useDashboardInternalContext();
	const { measureRef, collapsed } = useInlineControlsFit();

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
			<div
				ref={ measureRef }
				className={ clsx(
					styles[ 'inline-controls' ],
					collapsed && styles[ 'is-collapsed' ]
				) }
				aria-hidden={ collapsed || undefined }
				{ ...( collapsed ? { inert: 'true' } : {} ) }
			>
				{ fields.length > 0 && (
					<DataForm< WidgetAttributes >
						data={ data }
						fields={ fields }
						form={ form }
						onChange={ handleChange }
					/>
				) }

				<WidgetSettingsTrigger
					widget={ widget }
					widgetType={ widgetType }
				/>
			</div>

			{ collapsed && (
				<AttributeControlsDropdown
					widget={ widget }
					widgetType={ widgetType }
					fields={ fields }
					data={ data }
					onChange={ handleChange }
				/>
			) }
		</>
	);
}
