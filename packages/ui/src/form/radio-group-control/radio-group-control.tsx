import clsx from 'clsx';
import { forwardRef, Fragment } from '@wordpress/element';
import { Field, Fieldset, Radio, RadioGroup } from '../primitives';
import { Stack } from '../../stack';
import type { RadioGroupControlProps } from './types';
import styles from './style.module.css';

const ITEM_RENDER = <Stack gap="sm" align="start" className={ styles.item } />;

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
 * A complete radio group with a legend, optional description, and labeled items.
 */
export const RadioGroupControl = forwardRef<
	HTMLDivElement,
	RadioGroupControlProps
>( function RadioGroupControl(
	{
		items,
		className,
		label,
		description,
		details,
		hideLabelFromVision,
		name,
		...restProps
	},
	ref
) {
	return (
		<Field.Root name={ name } className={ clsx( styles.root, className ) }>
			<Fieldset.Root
				render={ <RadioGroup ref={ ref } { ...restProps } /> }
			>
				<Fieldset.Legend hideFromVision={ hideLabelFromVision }>
					{ label }
				</Fieldset.Legend>
				{ description && (
					<Fieldset.Description>{ description }</Fieldset.Description>
				) }
				{ details && <Fieldset.Details>{ details }</Fieldset.Details> }
				{ items.map( ( item ) => (
					<Field.Item key={ item.value } render={ ITEM_RENDER }>
						<div className={ styles[ 'radio-wrapper' ] }>
							<Radio
								value={ item.value }
								disabled={ item.disabled }
								className={ styles.radio }
							/>
						</div>
						<TextContainer isStack={ !! item.description }>
							<Field.Label
								variant="plain"
								className={ styles.label }
							>
								{ item.label }
							</Field.Label>
							{ item.description && (
								<Field.Description>
									{ item.description }
								</Field.Description>
							) }
						</TextContainer>
					</Field.Item>
				) ) }
			</Fieldset.Root>
		</Field.Root>
	);
} );
