/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { drawerRight, settings } from '@wordpress/icons';
/* eslint-disable @wordpress/use-recommended-components -- Dashboard is still experimental. */
import {
	Button,
	IconButton,
	Popover,
	Stack,
	VisuallyHidden,
} from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useWidgetSettingsToggle } from '../widget-settings';
import styles from './widget-attribute-controls.module.css';
import type { DashboardWidget, WidgetAttributes } from '../../types';

export interface AttributeControlsDropdownProps {
	/**
	 * The instance whose attributes these controls edit.
	 */
	widget: DashboardWidget< unknown >;

	/**
	 * The instance's widget type, source of the attribute schema.
	 */
	widgetType: WidgetType;

	/**
	 * The high-relevance fields the inline surface would have shown.
	 */
	fields: Field< WidgetAttributes >[];

	/**
	 * Current attribute values.
	 */
	data: WidgetAttributes;

	/**
	 * Stages an attribute edit, exactly like the inline controls do.
	 */
	onChange: ( edits: Record< string, unknown > ) => void;
}

/**
 * Collapsed presentation of the attribute controls: the settings trigger
 * stays as the tile's single entry point, and its popover holds the
 * high-relevance fields as a form plus, when other attributes exist, a More
 * settings entry point to the settings surface.
 *
 * @param {AttributeControlsDropdownProps} props Component props.
 */
export function AttributeControlsDropdown( {
	widget,
	widgetType,
	fields,
	data,
	onChange,
}: AttributeControlsDropdownProps ): React.ReactNode {
	const [ open, setOpen ] = useState( false );
	const { open: openSettings } = useWidgetSettingsToggle( widget );

	const hasMoreSettings = !! widgetType.attributes?.some(
		( attribute ) => attribute.relevance !== 'high'
	);

	const form = useMemo< Form >(
		() => ( {
			layout: { type: 'regular', labelPosition: 'top' },
			fields: fields.map( ( field ) => field.id ),
		} ),
		[ fields ]
	);

	return (
		<Popover.Root open={ open } onOpenChange={ setOpen } modal="trap-focus">
			<Popover.Trigger
				render={
					<IconButton
						icon={ settings }
						label={ __( 'Widget settings' ) }
						variant="minimal"
						tone="neutral"
						size="compact"
					/>
				}
			/>

			<Popover.Popup
				className={ styles[ 'dropdown-popup' ] }
				positioner={ <Popover.Positioner side="bottom" align="end" /> }
			>
				<VisuallyHidden render={ <Popover.Title /> }>
					{ __( 'Widget settings' ) }
				</VisuallyHidden>

				<Stack direction="column" align="stretch" gap="lg">
					{ fields.length > 0 && (
						<DataForm< WidgetAttributes >
							data={ data }
							fields={ fields }
							form={ form }
							onChange={ onChange }
						/>
					) }

					{ hasMoreSettings && (
						<Button
							variant="minimal"
							tone="neutral"
							size="compact"
							onClick={ () => {
								setOpen( false );
								openSettings();
							} }
						>
							<Button.Icon icon={ drawerRight } />
							{ __( 'More settings' ) }
						</Button>
					) }
				</Stack>
			</Popover.Popup>
		</Popover.Root>
	);
}
