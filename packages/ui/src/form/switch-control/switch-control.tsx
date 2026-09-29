import clsx from 'clsx';
import { forwardRef, Fragment } from '@wordpress/element';
import { Field, Switch } from '../primitives';
import { Stack } from '../../stack';
import type { SwitchControlProps } from './types';
import styles from './style.module.css';

const ROOT_RENDER = <Stack gap="sm" align="start" />;

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
 * A complete switch field with integrated label and description.
 */
export const SwitchControl = forwardRef< HTMLSpanElement, SwitchControlProps >(
	function SwitchControl(
		{
			label,
			description,
			details,
			hideLabelFromVision,
			className,
			name,
			...switchProps
		},
		ref
	) {
		const hasSupportingText = !! description || !! details;

		return (
			<Field.Root
				name={ name }
				className={ clsx( styles.root, className ) }
				render={ ROOT_RENDER }
			>
				<div className={ styles[ 'switch-wrapper' ] }>
					<Switch
						ref={ ref }
						className={ styles.switch }
						{ ...switchProps }
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
			</Field.Root>
		);
	}
);
