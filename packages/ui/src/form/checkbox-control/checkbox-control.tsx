import clsx from 'clsx';
import { forwardRef, Fragment } from '@wordpress/element';
import { Checkbox, Field } from '../primitives';
import { Stack } from '../../stack';
import type { CheckboxControlProps } from './types';
import styles from './style.module.css';

const ITEM_RENDER = <Stack gap="sm" align="start" />;

const TextContainer = ( {
	isStack,
	...restProps
}: {
	isStack?: boolean;
} & React.PropsWithChildren ) =>
	isStack ? (
		<Stack direction="column" gap="xs" { ...restProps } />
	) : (
		<Fragment { ...restProps } />
	);

/**
 * A complete checkbox field with integrated label and description.
 */
export const CheckboxControl = forwardRef<
	HTMLSpanElement,
	CheckboxControlProps
>( function CheckboxControl(
	{
		label,
		description,
		details,
		hideLabelFromVision,
		className,
		name,
		...checkboxProps
	},
	ref
) {
	const hasSupportingText = !! description || !! details;

	return (
		<Field.Root name={ name } className={ clsx( styles.root, className ) }>
			<Field.Item render={ ITEM_RENDER }>
				<div className={ styles[ 'checkbox-wrapper' ] }>
					{ /* The zero-width space allows to use the same line height for both
						the checkbox wrapper and the label, ensuring that the first line of the
						label and the checkbox are always vertically centered */ }
					&#8203;
					<Checkbox
						ref={ ref }
						className={ styles.checkbox }
						{ ...checkboxProps }
					/>
				</div>
				<TextContainer isStack={ hasSupportingText }>
					<Field.Label
						variant="plain"
						hideFromVision={ hideLabelFromVision }
						className={ styles.label }
					>
						{ label }
					</Field.Label>
					{ description && (
						<Field.Description>{ description }</Field.Description>
					) }
					{ details && <Field.Details>{ details }</Field.Details> }
				</TextContainer>
			</Field.Item>
		</Field.Root>
	);
} );
