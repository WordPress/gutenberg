/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import type { DataFormControlProps } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
/* eslint-disable @wordpress/use-recommended-components */
import { Button, Fieldset, Stack, Text } from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

/**
 * Internal dependencies
 */
import type { WidgetGridSettings } from '../../../types';
import { GridThumbnail } from './thumbnail-grid';
import { MasonryThumbnail } from './thumbnail-masonry';
import styles from './style.module.css';

interface ModelThumbnailProps {
	model: string;
	className?: string;
}

function ModelThumbnail( {
	model,
	className,
}: ModelThumbnailProps ): React.ReactNode {
	return model === 'masonry' ? (
		<MasonryThumbnail className={ className } />
	) : (
		<GridThumbnail className={ className } />
	);
}

/**
 * Card-style picker for the layout model: each option (`grid`, `masonry`)
 * renders as a thumbnail card in a radio group. Wired as the `Edit` control
 * for the `model` field of the layout settings DataForm.
 *
 * @param {DataFormControlProps< WidgetGridSettings >} props DataForm control props.
 */
export function LayoutModelEditField( {
	data,
	field,
	onChange,
}: DataFormControlProps< WidgetGridSettings > ): React.ReactNode {
	const { getValue, setValue, elements = [] } = field;
	const value = getValue( { item: data } );
	const disabled = field.isDisabled( { item: data, field } );

	const onSelect = useCallback(
		( nextValue: string | number | undefined ) =>
			onChange( setValue( { item: data, value: nextValue } ) ),
		[ data, onChange, setValue ]
	);

	return (
		<Fieldset.Root>
			<Fieldset.Legend>{ field.label }</Fieldset.Legend>
			<Stack direction="row" gap="md" role="radiogroup">
				{ elements.map( ( option ) => {
					const isSelected = value === option.value;

					return (
						<Button
							key={ String( option.value ) }
							variant="unstyled"
							role="radio"
							aria-checked={ isSelected }
							disabled={ disabled }
							className={ clsx( styles.option, {
								[ styles.optionSelected ]: isSelected,
							} ) }
							onClick={ () => onSelect( option.value ) }
						>
							<Stack direction="column" gap="sm" align="stretch">
								<ModelThumbnail
									model={ String( option.value ) }
									className={ styles.thumbnail }
								/>
								<Text>{ option.label }</Text>
							</Stack>
						</Button>
					);
				} ) }
			</Stack>
			{ typeof field.description === 'string' && (
				<Fieldset.Description>
					{ field.description }
				</Fieldset.Description>
			) }
		</Fieldset.Root>
	);
}
