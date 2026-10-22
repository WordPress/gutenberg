import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import * as Card from '../../card';
import { Stack } from '../../stack';
import { Field, Radio } from '../primitives';
import type { CardRadioProps } from './types';
import styles from './style.module.scss';

/**
 * A radio option presented as a card, for high-emphasis single selection
 * such as choosing a plan or a payment method.
 *
 * Must be rendered inside a `RadioGroup`. To label the group, pass
 * `RadioGroup` to `Fieldset.Root`'s `render` prop.
 *
 * ```jsx
 * import { CardRadio, Fieldset, RadioGroup } from '@wordpress/ui';
 *
 * function MyComponent() {
 * 	return (
 * 		<Fieldset.Root render={ <RadioGroup defaultValue="monthly" /> }>
 * 			<Fieldset.Legend>Billing</Fieldset.Legend>
 * 			<CardRadio value="monthly" label="Monthly" />
 * 			<CardRadio value="yearly" label="Yearly" description="Save 20%" />
 * 		</Fieldset.Root>
 * 	);
 * }
 * ```
 */
export const CardRadio = forwardRef< HTMLSpanElement, CardRadioProps >(
	function UnforwardedCardRadio(
		{ label, description, children, className, ...radioProps },
		ref
	) {
		return (
			<Field.Root
				render={
					<Card.Root className={ clsx( styles.root, className ) } />
				}
			>
				<Field.Item
					render={
						<Card.Content
							render={ <Stack direction="column" gap="lg" /> }
						/>
					}
				>
					<Stack direction="column" gap="xs">
						<Stack justify="space-between" align="center" gap="md">
							<Field.Label
								variant="plain"
								className={ styles.label }
							>
								{ label }
							</Field.Label>
							<Radio
								ref={ ref }
								className={ styles.radio }
								{ ...radioProps }
							/>
						</Stack>
						{ description && (
							<Field.Description>
								{ description }
							</Field.Description>
						) }
					</Stack>
					{ children }
				</Field.Item>
			</Field.Root>
		);
	}
);
