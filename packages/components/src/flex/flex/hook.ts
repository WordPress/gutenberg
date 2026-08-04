import clsx from 'clsx';
import deprecated from '@wordpress/deprecated';

import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useResponsiveValue } from '../../utils/use-responsive-value';
import { space } from '../../utils/space';
import type { FlexProps } from '../types';
import styles from '../style.module.scss';

function useDeprecatedProps(
	props: WordPressComponentProps< FlexProps, 'div' >
): Omit< typeof props, 'isReversed' > {
	const { isReversed, ...otherProps } = props;

	if ( typeof isReversed !== 'undefined' ) {
		deprecated( 'Flex isReversed', {
			alternative: 'Flex direction="row-reverse" or "column-reverse"',
			since: '5.9',
		} );
		return {
			...otherProps,
			direction: isReversed ? 'row-reverse' : 'row',
		};
	}

	return otherProps;
}

export function useFlex( props: WordPressComponentProps< FlexProps, 'div' > ) {
	const {
		align,
		className,
		direction: directionProp = 'row',
		expanded = true,
		gap = 2,
		justify = 'space-between',
		style,
		wrap = false,
		...otherProps
	} = useContextSystem( useDeprecatedProps( props ), 'Flex' );

	const directionAsArray = Array.isArray( directionProp )
		? directionProp
		: [ directionProp ];
	const direction = useResponsiveValue( directionAsArray );

	const isColumn =
		typeof direction === 'string' && !! direction.includes( 'column' );

	const flexStyle = {
		...style,
		'--wp-components-flex-align':
			align ?? ( isColumn ? 'normal' : 'center' ),
		'--wp-components-flex-direction': direction,
		'--wp-components-flex-wrap': wrap ? 'wrap' : 'nowrap',
		'--wp-components-flex-gap': space( gap ),
		'--wp-components-flex-justify': justify,
	};

	return {
		...otherProps,
		className: clsx(
			styles.flex,
			isColumn ? styles[ 'items-column' ] : styles[ 'items-row' ],
			expanded &&
				( isColumn
					? styles[ 'expanded-column' ]
					: styles[ 'expanded-row' ] ),
			className
		),
		style: flexStyle,
		isColumn,
	};
}
