import clsx from 'clsx';
import { forwardRef, Fragment, useId } from '@wordpress/element';
import { Field, Switch } from '../primitives';
import { Stack } from '../../stack';
import type { SwitchControlProps } from './types';
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
			'aria-describedby': ariaDescribedBy,
			...switchProps
		},
		ref
	) {
		const hasSupportingText = !! description || !! details;
		const descriptionId = useId();
		const describedBy = [
			ariaDescribedBy,
			description ? descriptionId : undefined,
		]
			.filter( Boolean )
			.join( ' ' );

		return (
			<Field.Root
				name={ name }
				className={ clsx( styles.root, className ) }
			>
				<Field.Item render={ ITEM_RENDER }>
					<div className={ styles[ 'switch-wrapper' ] }>
						<Switch
							ref={ ref }
							className={ styles.switch }
							{ ...switchProps }
							// Base UI Switch does not apply Field description props to the
							// visible switch, unlike Checkbox. Associate the description here.
							aria-describedby={ describedBy || undefined }
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
							<Field.Description id={ descriptionId }>
								{ description }
							</Field.Description>
						) }
						{ details && (
							<Field.Details>{ details }</Field.Details>
						) }
					</TextContainer>
				</Field.Item>
			</Field.Root>
		);
	}
);
