/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useReserveHeaderSpace } from '../widget-header/widget-header-fit';
import { WidgetSettingsTrigger } from '../widget-settings';
import { AttributesDropdown } from './attributes-dropdown';
import { useInlineFit } from './use-inline-fit';
import styles from './widget-attributes.module.css';
import type { DashboardWidget, WidgetAttributeValues } from '../../types';

type WidgetAttributesProps = {
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
 * @param {WidgetAttributesProps} props Component props.
 */
export function WidgetAttributes( {
	widget,
	widgetType,
}: WidgetAttributesProps ): React.ReactNode {
	const { layout, onLayoutChange, scheduleAutoSave } =
		useDashboardInternalContext();

	const hasSettingsSurface = !! widgetType.attributes?.some(
		( attribute ) => attribute.relevance !== 'high'
	);

	// The settings trigger stays in the toolbar in both presentations, so it
	// reserves its own footprint from the header's fit budget.
	const settingsReserveRef =
		useReserveHeaderSpace< HTMLSpanElement >( 'settings' );

	// While the user interacts with a presentation, the fit holds it in
	// place; replacing it mid-interaction would drop focus on the floor.
	// The hold covers the open dropdown, focus inside the inline form, and
	// focus on the dropdown trigger itself: dismissing the popup restores
	// focus to the trigger asynchronously, so the trigger must survive
	// until focus moves on. The pending transition applies afterwards.
	const [ dropdownOpen, setDropdownOpen ] = useState( false );
	const [ inlineHasFocus, setInlineHasFocus ] = useState( false );
	const [ dropdownTriggerHasFocus, setDropdownTriggerHasFocus ] =
		useState( false );

	const { measureRef, collapsed } = useInlineFit( {
		locked: dropdownOpen || inlineHasFocus || dropdownTriggerHasFocus,
	} );

	// A transition can only start once focus left the outgoing
	// presentation; clear its flag if it unmounts with the flag still set.
	useEffect( () => {
		if ( collapsed ) {
			setInlineHasFocus( false );
		} else {
			setDropdownTriggerHasFocus( false );
		}
	}, [ collapsed ] );

	const fields = useMemo< Field< WidgetAttributeValues >[] >(
		() =>
			( widgetType.attributes ?? [] ).filter(
				( attribute ) => attribute.relevance === 'high'
			) as Field< WidgetAttributeValues >[],
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
		{} ) as WidgetAttributeValues;

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
						onFocus={ () => setInlineHasFocus( true ) }
						onBlur={ ( event ) => {
							if (
								! event.currentTarget.contains(
									event.relatedTarget as Node | null
								)
							) {
								setInlineHasFocus( false );
							}
						} }
					>
						<DataForm< WidgetAttributeValues >
							data={ data }
							fields={ fields }
							form={ form }
							onChange={ handleChange }
						/>
					</Stack>
				)
			) : (
				<span
					className={ styles[ 'dropdown-area' ] }
					onFocus={ () => setDropdownTriggerHasFocus( true ) }
					onBlur={ ( event ) => {
						if (
							! event.currentTarget.contains(
								event.relatedTarget as Node | null
							)
						) {
							setDropdownTriggerHasFocus( false );
						}
					} }
				>
					<AttributesDropdown
						fields={ fields }
						data={ data }
						onChange={ handleChange }
						onOpenChange={ setDropdownOpen }
					/>
				</span>
			) }

			{ hasSettingsSurface && (
				<span
					ref={ settingsReserveRef }
					className={ styles[ 'persistent-controls' ] }
				>
					<WidgetSettingsTrigger
						widget={ widget }
						widgetType={ widgetType }
					/>
				</span>
			) }
		</>
	);
}
