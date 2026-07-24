/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import type { DataFormControlProps, Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { ContentType } from '../types';

export const LABELS_ACTIONS_FIELD_ID = '__labels_actions';

interface LabelsActionsOptions {
	labelKeys: ReadonlyArray< string >;
	deriveLabels: (
		plural: string,
		singular: string
	) => Record< string, string >;
	helpText: string;
}

/**
 * Builds the phantom Field rendered at the top of a Labels card. It supplies
 * descriptive help text plus Auto-fill / Clear buttons that mutate the labels
 * sub-record in place. Auto-fill delegates to the caller-supplied
 * `deriveLabels` (per content type), and Clear blanks every key in
 * `labelKeys` except `singular_name`.
 *
 * @param options
 */
export function createLabelsActionsField< T extends ContentType >(
	options: LabelsActionsOptions
): Field< T > {
	const { labelKeys, deriveLabels, helpText } = options;

	function LabelsActionsEdit( {
		data,
		onChange,
	}: DataFormControlProps< T > ) {
		const plural = data.title.raw.trim();
		const singular = data.config.labels.singular_name.trim();
		const canAutoFill = !! plural.length && !! singular.length;
		const currentLabels = data.config.labels as Record<
			string,
			string | undefined
		>;
		const hasOverrides = labelKeys.some(
			( key ) =>
				key !== 'singular_name' && ( currentLabels[ key ] ?? '' ) !== ''
		);
		return (
			<Stack direction="column" gap="md">
				<Text variant="body-md">{ helpText }</Text>
				<Stack direction="row" justify="flex-end" gap="sm">
					<Button
						__next40pxDefaultSize
						variant="secondary"
						size="compact"
						accessibleWhenDisabled
						disabled={ ! canAutoFill }
						onClick={ () =>
							onChange( {
								config: {
									...data.config,
									labels: {
										...data.config.labels,
										...deriveLabels( plural, singular ),
									},
								},
							} as Partial< T > )
						}
					>
						{ __( 'Auto-fill labels' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						size="compact"
						icon={ trash }
						isDestructive
						label={ __( 'Clear labels' ) }
						accessibleWhenDisabled
						disabled={ ! hasOverrides }
						onClick={ () => {
							const cleared: Record<
								string,
								string | undefined
							> = {
								singular_name: data.config.labels.singular_name,
							};
							for ( const key of labelKeys ) {
								if ( key !== 'singular_name' ) {
									cleared[ key ] = '';
								}
							}
							onChange( {
								config: { ...data.config, labels: cleared },
							} as Partial< T > );
						} }
					/>
				</Stack>
			</Stack>
		);
	}

	// TODO: Replace this phantom field once DataForm supports per-card header
	// actions or arbitrary React among children. We register a no-value Field
	// solely to render the Labels card's description and action buttons,
	// suppressing its label via labelPosition: 'none' at the form-fields site.
	return {
		id: LABELS_ACTIONS_FIELD_ID,
		label: '',
		getValue: () => '',
		setValue: () => ( {} ),
		Edit: LabelsActionsEdit,
		enableSorting: false,
		filterBy: false,
	} as Field< T >;
}
