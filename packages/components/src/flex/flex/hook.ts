/**
 * External dependencies
 */
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useResponsiveValue } from '../../utils/use-responsive-value';
import { space } from '../../utils/space';
import type { FlexProps } from '../types';
import styles from '../style.module.scss';

type FlexCustomProperty =
	| '--wp-components-flex-align'
	| '--wp-components-flex-direction'
	| '--wp-components-flex-wrap'
	| '--wp-components-flex-gap'
	| '--wp-components-flex-justify';

type FlexStyle = CSSProperties &
	Partial<
		Record< FlexCustomProperty, CSSProperties[ keyof CSSProperties ] >
	>;

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

	const flexStyle: FlexStyle = {
		'--wp-components-flex-align':
			align ?? ( isColumn ? 'normal' : 'center' ),
		'--wp-components-flex-direction': direction,
		...( wrap && { '--wp-components-flex-wrap': 'wrap' } ),
		'--wp-components-flex-gap': space( gap ),
		'--wp-components-flex-justify': justify,
		...style,
	};

	return {
		...otherProps,
		className: clsx(
			styles.flex,
			isColumn ? styles.itemsColumn : styles.itemsRow,
			expanded &&
				( isColumn ? styles.expandedColumn : styles.expandedRow ),
			className
		),
		style: flexStyle,
		isColumn,
	};
}
