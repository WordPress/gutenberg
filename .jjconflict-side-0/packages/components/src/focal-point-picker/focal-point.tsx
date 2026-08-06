import clsx from 'clsx';
import { PolymorphicElement } from '../utils/polymorphic-element';
import styles from './style.module.scss';
import type { FocalPointProps } from './types';
import type { WordPressComponentProps } from '../context';

export default function FocalPoint( {
	left = '50%',
	top = '50%',
	...props
}: WordPressComponentProps< FocalPointProps, 'div' > ) {
	const style = { left, top };

	return (
		<PolymorphicElement
			as="div"
			{ ...props }
			className={ clsx(
				styles.pointer,
				'components-focal-point-picker__icon_container',
				{ [ styles[ 'is-dragging' ] ]: props.isDragging }
			) }
			style={ style }
		/>
	);
}
