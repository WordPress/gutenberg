import type { FocusEvent } from 'react';
import { useMergeRefs } from '@wordpress/compose';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useReserveHeaderSpace } from '../widget-header/widget-header-fit';
import { WidgetSettingsTrigger } from '../widget-settings';
import { AttributesDropdown } from './attributes-dropdown';
import { useInlineFit } from './use-inline-fit';
import type { InlinePresentation } from './use-inline-fit';
import { withSurface } from './with-surface';
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
 * they unmount and collapse: a single field with a fixed set of options
 * into one select holding them, and anything else (or a select that does
 * not fit either) into a dropdown holding the fields as a form. The
 * settings trigger is not part of the collapse and stays in the toolbar.
 * While collapsed, the last measurements are retained to decide when to
 * expand back; remounting re-measures and re-collapses if a retained
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

	// The settings trigger stays in the toolbar in every presentation, so
	// it reserves its own footprint from the header's fit budget.
	const settingsReserveRef =
		useReserveHeaderSpace< HTMLSpanElement >( 'settings' );

	const fields = useMemo< Field< WidgetAttributeValues >[] >(
		() =>
			( widgetType.attributes ?? [] ).filter(
				( attribute ) => attribute.relevance === 'high'
			) as Field< WidgetAttributeValues >[],
		[ widgetType.attributes ]
	);

	// A single field with a fixed set of options (a toggle group, a radio
	// control) collapses to one select holding them before it collapses
	// to the dropdown. Several fields, or one without options, skip it; so
	// does an array field, which would need a multiple select.
	const onlyField = fields.length === 1 ? fields[ 0 ] : undefined;
	const canSelect =
		!! onlyField &&
		onlyField.type !== 'array' &&
		( !! onlyField.elements?.length || !! onlyField.getElements );

	// While the user interacts with a collapsed presentation, the fit holds
	// it in place; expanding mid-interaction would drop focus on the floor.
	// The hold covers a focused select (a native select is focused while
	// open), the open dropdown, and focus on its trigger: dismissing the
	// popup restores focus to the trigger asynchronously, so the trigger
	// must survive until focus moves on. The pending expansion applies
	// afterwards. Focus inside the inline form is tracked only to hand it
	// on if the controls collapse.
	const [ dropdownOpen, setDropdownOpen ] = useState( false );
	const [ focused, setFocused ] = useState< InlinePresentation | null >(
		null
	);

	const { measureRef, selectMeasureRef, presentation } = useInlineFit( {
		canSelect,
		locked: dropdownOpen || ( focused !== null && focused !== 'inline' ),
	} );

	// Controls that stop fitting collapse even while focused. Their focus
	// moves to the presentation that takes their place (the select, or the
	// dropdown trigger), so a keyboard user is not dropped onto the page.
	// Noted while rendering: the unmount can blur the old presentation
	// before an effect runs.
	const triggerRef = useRef< HTMLButtonElement >( null );
	const selectAreaRef = useRef< HTMLSpanElement >( null );
	const selectRef = useMergeRefs( [ selectAreaRef, selectMeasureRef ] );
	const [ previous, setPrevious ] = useState( presentation );
	const [ focusTarget, setFocusTarget ] =
		useState< InlinePresentation | null >( null );
	if ( presentation !== previous ) {
		setPrevious( presentation );
		setFocusTarget( focused === previous ? presentation : null );
	}

	// A presentation can only expand once focus left it; clear the flag of
	// whichever presentation unmounted with it still set.
	useEffect( () => {
		setFocused( ( current ) =>
			current === presentation ? current : null
		);
	}, [ presentation ] );

	useEffect( () => {
		if ( focusTarget === 'dropdown' ) {
			triggerRef.current?.focus();
		} else if ( focusTarget === 'select' ) {
			selectAreaRef.current?.querySelector( 'select' )?.focus();
		}
		if ( focusTarget !== null ) {
			setFocusTarget( null );
		}
	}, [ focusTarget ] );

	// Focus handlers for the wrapper of one presentation.
	const trackFocus = ( target: InlinePresentation ) => ( {
		onFocus: () => setFocused( target ),
		onBlur: ( event: FocusEvent< HTMLElement > ) => {
			if (
				! event.currentTarget.contains(
					event.relatedTarget as Node | null
				)
			) {
				setFocused( ( current ) =>
					current === target ? null : current
				);
			}
		},
	} );

	// Each field's `Edit` learns it renders in the header; the dropdown
	// passes its own surface.
	const headerFields = useMemo(
		() => withSurface( fields, 'header' ),
		[ fields ]
	);

	// The select presentation renders the single field through the
	// built-in select control, whatever control it declares inline.
	const selectFields = useMemo< Field< WidgetAttributeValues >[] >(
		() => ( onlyField ? [ { ...onlyField, Edit: 'select' } ] : [] ),
		[ onlyField ]
	);

	// A `row` top-level layout lays the controls out horizontally; each field
	// carries `labelPosition: 'none'` so the control renders bare, its label
	// kept as the accessible name.
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
			{ presentation === 'inline' && fields.length > 0 && (
				<Stack
					direction="row"
					align="center"
					gap="xs"
					ref={ measureRef }
					className={ styles[ 'inline-controls' ] }
					{ ...trackFocus( 'inline' ) }
				>
					<DataForm< WidgetAttributeValues >
						data={ data }
						fields={ headerFields }
						form={ form }
						onChange={ handleChange }
					/>
				</Stack>
			) }

			{ presentation === 'select' && (
				<span
					ref={ selectRef }
					className={ styles[ 'select-area' ] }
					{ ...trackFocus( 'select' ) }
				>
					<DataForm< WidgetAttributeValues >
						data={ data }
						fields={ selectFields }
						form={ form }
						onChange={ handleChange }
					/>
				</span>
			) }

			{ presentation === 'dropdown' && (
				<span
					className={ styles[ 'dropdown-area' ] }
					{ ...trackFocus( 'dropdown' ) }
				>
					<AttributesDropdown
						fields={ fields }
						data={ data }
						onChange={ handleChange }
						onOpenChange={ setDropdownOpen }
						triggerRef={ triggerRef }
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
