import clsx from 'clsx';
import { PolymorphicElement } from '../utils/polymorphic-element';
import styles from './style.module.scss';
import type { FocalPointPickerGridProps } from './types';
import type { WordPressComponentProps } from '../context/wordpress-component';

export default function FocalPointPickerGrid( {
	bounds,
	...props
}: WordPressComponentProps< FocalPointPickerGridProps, 'div' > ) {
	return (
		<PolymorphicElement
			as="div"
			{ ...props }
			className={ clsx(
				styles.grid,
				'components-focal-point-picker__grid',
				{ [ styles[ 'show-overlay' ] ]: props.showOverlay }
			) }
			style={ {
				width: bounds.width,
				height: bounds.height,
			} }
		>
			<div
				className={ clsx(
					styles[ 'grid-line' ],
					styles[ 'grid-line-x' ]
				) }
				style={ { top: '33%' } }
			/>
			<div
				className={ clsx(
					styles[ 'grid-line' ],
					styles[ 'grid-line-x' ]
				) }
				style={ { top: '66%' } }
			/>
			<div
				className={ clsx(
					styles[ 'grid-line' ],
					styles[ 'grid-line-y' ]
				) }
				style={ { left: '33%' } }
			/>
			<div
				className={ clsx(
					styles[ 'grid-line' ],
					styles[ 'grid-line-y' ]
				) }
				style={ { left: '66%' } }
			/>
		</PolymorphicElement>
	);
}
