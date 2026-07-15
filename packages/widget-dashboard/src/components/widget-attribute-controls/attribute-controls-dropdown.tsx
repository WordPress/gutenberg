/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
/* eslint-disable @wordpress/use-recommended-components -- Dashboard is still experimental. */
import {
	Button,
	IconButton,
	Popover,
	Stack,
	VisuallyHidden,
} from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

/**
 * Internal dependencies
 */
import styles from './widget-attribute-controls.module.css';
import type { WidgetAttributes } from '../../types';

export interface AttributeControlsDropdownProps {
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

	/**
	 * Observes open-state changes, from the trigger and from dismissals.
	 * The popover owns its lifecycle; the caller only listens, so the fit
	 * can hold the collapsed presentation while the user is inside it.
	 */
	onOpenChange: ( open: boolean ) => void;
}

/**
 * Collapsed presentation of the prominent surface: a single trigger whose
 * popover holds the high-relevance fields as a form. The settings trigger
 * is not part of the collapse; it stays in the toolbar.
 *
 * @param {AttributeControlsDropdownProps} props Component props.
 */
export function AttributeControlsDropdown( {
	fields,
	data,
	onChange,
	onOpenChange,
}: AttributeControlsDropdownProps ): React.ReactNode {
	const form = useMemo< Form >(
		() => ( {
			layout: { type: 'regular', labelPosition: 'top' },
			fields: fields.map( ( field ) => field.id ),
		} ),
		[ fields ]
	);

	return (
		<Popover.Root onOpenChange={ onOpenChange }>
			<Popover.Trigger
				render={
					<IconButton
						icon={ settings }
						label={ __( 'Widget controls' ) }
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
				<Stack direction="column" gap="lg" align="flex-end">
					<VisuallyHidden render={ <Popover.Title /> }>
						{ __( 'Widget controls' ) }
					</VisuallyHidden>

					<DataForm< WidgetAttributes >
						data={ data }
						fields={ fields }
						form={ form }
						onChange={ onChange }
					/>

					<Popover.Close render={ <Button variant="solid" /> }>
						{ __( 'Close' ) }
					</Popover.Close>
				</Stack>
			</Popover.Popup>
		</Popover.Root>
	);
}
