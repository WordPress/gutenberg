import clsx from 'clsx';
import { FlexItem } from '../flex';
import { Text } from '../text';
import styles from './style.module.scss';
import { VisuallyHidden } from '../visually-hidden';
import type { WordPressComponentProps } from '../context';
import type { InputControlLabelProps } from './types';

export default function Label( {
	children,
	hideLabelFromVision,
	htmlFor,
	className,
	labelPosition: _labelPosition,
	size: _size,
	...props
}: WordPressComponentProps< InputControlLabelProps, 'label', false > ) {
	if ( ! children ) {
		return null;
	}

	if ( hideLabelFromVision ) {
		return (
			<VisuallyHidden as="label" htmlFor={ htmlFor }>
				{ children }
			</VisuallyHidden>
		);
	}

	return (
		<FlexItem className={ styles[ 'label-wrapper' ] }>
			<Text
				{ ...props }
				as="label"
				htmlFor={ htmlFor }
				className={ clsx( styles.label, className ) }
			>
				{ children }
			</Text>
		</FlexItem>
	);
}
