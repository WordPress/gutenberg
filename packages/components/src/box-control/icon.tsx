import clsx from 'clsx';
import type { WordPressComponentProps } from '../context';
import { PolymorphicElement } from '../utils/polymorphic-element';
import type { BoxControlIconProps, BoxControlProps } from './types';
import styles from './style.module.scss';

const BASE_ICON_SIZE = 24;

export default function BoxControlIcon( {
	as = 'span',
	size = 24,
	side = 'all',
	sides,
	className,
	...props
}: WordPressComponentProps< BoxControlIconProps, 'span' > ) {
	const isSideDisabled = (
		value: NonNullable< BoxControlProps[ 'sides' ] >[ number ]
	) => sides?.length && ! sides.includes( value );

	const hasSide = (
		value: NonNullable< BoxControlProps[ 'sides' ] >[ number ]
	) => {
		if ( isSideDisabled( value ) ) {
			return false;
		}

		return side === 'all' || side === value;
	};

	const top = hasSide( 'top' ) || hasSide( 'vertical' );
	const right = hasSide( 'right' ) || hasSide( 'horizontal' );
	const bottom = hasSide( 'bottom' ) || hasSide( 'vertical' );
	const left = hasSide( 'left' ) || hasSide( 'horizontal' );

	// Simulates SVG Icon scaling.
	const scale = size / BASE_ICON_SIZE;

	return (
		<PolymorphicElement
			as={ as }
			style={ { transform: `scale(${ scale })` } }
			{ ...props }
			className={ clsx( styles[ 'icon-root' ], className ) }
		>
			<span className={ styles[ 'icon-viewbox' ] }>
				<span
					className={ clsx(
						styles[ 'icon-stroke' ],
						styles[ 'icon-top' ],
						{
							[ styles[ 'is-highlighted' ] ]: top,
						}
					) }
				/>
				<span
					className={ clsx(
						styles[ 'icon-stroke' ],
						styles[ 'icon-right' ],
						{
							[ styles[ 'is-highlighted' ] ]: right,
						}
					) }
				/>
				<span
					className={ clsx(
						styles[ 'icon-stroke' ],
						styles[ 'icon-bottom' ],
						{
							[ styles[ 'is-highlighted' ] ]: bottom,
						}
					) }
				/>
				<span
					className={ clsx(
						styles[ 'icon-stroke' ],
						styles[ 'icon-left' ],
						{
							[ styles[ 'is-highlighted' ] ]: left,
						}
					) }
				/>
			</span>
		</PolymorphicElement>
	);
}
