/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetSettingsTrigger } from '../widget-settings';
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
 * Normal-mode controls: the `relevance: 'high'` attributes inline, plus the
 * settings trigger that opens the full settings drawer when needed.
 * Inline controls appear only for the high-relevance fields.
 * Inline edits publish immediately, so they need no Save affordance.
 *
 * @param {WidgetAttributeControlsProps} props Component props.
 */
export function WidgetAttributeControls( {
	widget,
	widgetType,
}: WidgetAttributeControlsProps ): React.ReactNode {
	const { layout, onLayoutChange, commit } = useDashboardInternalContext();

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

	// Publish once staging has advanced, so `commit` reads the fresh layout
	// instead of the stale closure captured at edit time.
	const [ pendingCommit, setPendingCommit ] = useState( false );
	useEffect( () => {
		if ( pendingCommit ) {
			commit( { exitEditMode: false } );
			setPendingCommit( false );
		}
	}, [ pendingCommit, commit ] );

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

			setPendingCommit( true );
		},
		[ layout, onLayoutChange, widget.uuid ]
	);

	const data = ( widget.attributes ??
		widgetType.example?.attributes ??
		{} ) as WidgetAttributes;

	return (
		<>
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
		</>
	);
}
