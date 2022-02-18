/**
 * WordPress dependencies
 */
import { lineDashed, lineDotted, lineSolid } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { StyledLabel } from '../../base-control/styles/base-control-styles';
import { View } from '../../view';
import { Flex } from '../../flex';
import { VisuallyHidden } from '../../visually-hidden';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useBorderControlStylePicker } from './hook';

import type { LabelProps, StylePickerProps } from '../types';

const BORDER_STYLES = [
	{ label: __( 'Solid' ), icon: lineSolid, value: 'solid' },
	{ label: __( 'Dashed' ), icon: lineDashed, value: 'dashed' },
	{ label: __( 'Dotted' ), icon: lineDotted, value: 'dotted' },
];

const Label = ( props: LabelProps ) => {
	const { label, hideLabelFromVision } = props;

	if ( ! label ) {
		return null;
	}

	return hideLabelFromVision ? (
		<VisuallyHidden as="label">{ label }</VisuallyHidden>
	) : (
		<StyledLabel>{ label }</StyledLabel>
	);
};

const BorderControlStylePicker = (
	props: WordPressComponentProps< StylePickerProps, 'div' >,
	forwardedRef: React.Ref< any >
) => {
	const {
		buttonClassName,
		hideLabelFromVision,
		label,
		onChange,
		value,
		...otherProps
	} = useBorderControlStylePicker( props );

	return (
		<View { ...otherProps } ref={ forwardedRef }>
			<Label
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
			/>
			<Flex justify="flex-start" gap={ 1 }>
				{ BORDER_STYLES.map( ( borderStyle ) => (
					<Button
						key={ borderStyle.value }
						className={ buttonClassName }
						icon={ borderStyle.icon }
						isSmall
						isPressed={ borderStyle.value === value }
						onClick={ () =>
							onChange(
								borderStyle.value === value
									? undefined
									: borderStyle.value
							)
						}
						aria-label={ borderStyle.label }
					/>
				) ) }
			</Flex>
		</View>
	);
};

const ConnectedBorderControlStylePicker = contextConnect(
	BorderControlStylePicker,
	'BorderControlStylePicker'
);

export default ConnectedBorderControlStylePicker;
