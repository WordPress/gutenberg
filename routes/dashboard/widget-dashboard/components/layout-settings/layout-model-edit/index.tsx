/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { WidgetGridSettings } from '../../../types';
import { GridThumbnail } from './grid-thumbnail';
import { MasonryThumbnail } from './masonry-thumbnail';
import styles from './style.module.css';

function ModelThumbnail( {
	model,
	className,
}: {
	model: string;
	className?: string;
} ): React.ReactNode {
	return model === 'masonry' ? (
		<MasonryThumbnail className={ className } />
	) : (
		<GridThumbnail className={ className } />
	);
}

/**
 * Card-style picker for the dashboard layout model. Renders each option
 * (`grid`, `masonry`) as a visual card with an inline-SVG thumbnail and a
 * label, exposed as a radio group for assistive tech.
 *
 * Used as the `Edit` control for the `model` field of the layout
 * settings DataForm.
 *
 * @param props          DataForm control props supplied by `<DataForm />`.
 * @param props.data     Current form data for the dashboard grid settings.
 * @param props.field    Field descriptor with label, description, and options.
 * @param props.onChange Commits an edit to the form's staging buffer.
 * @return The model picker.
 */
export function LayoutModelEdit( {
	data,
	field,
	onChange,
}: DataFormControlProps< WidgetGridSettings > ): React.ReactNode {
	const currentValue = field.getValue( { item: data } );
	const elements = field.elements ?? [];

	return (
		<BaseControl help={ field.description }>
			<BaseControl.VisualLabel>{ field.label }</BaseControl.VisualLabel>
			<Stack
				direction="row"
				gap="md"
				role="radiogroup"
				aria-label={ field.label }
			>
				{ elements.map( ( option ) => {
					const isSelected = currentValue === option.value;
					return (
						<button
							key={ String( option.value ) }
							type="button"
							role="radio"
							aria-checked={ isSelected }
							className={ clsx( styles.option, {
								[ styles.optionSelected ]: isSelected,
							} ) }
							onClick={ () =>
								onChange(
									field.setValue( {
										item: data,
										value: option.value,
									} )
								)
							}
						>
							<ModelThumbnail
								model={ String( option.value ) }
								className={ styles.thumbnail }
							/>
							<Text>{ option.label }</Text>
						</button>
					);
				} ) }
			</Stack>
		</BaseControl>
	);
}
