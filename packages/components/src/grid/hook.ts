import clsx from 'clsx';
import type { WordPressComponentProps } from '../context';
import { useContextSystem } from '../context';
import { getAlignmentProps } from './utils';
import { useResponsiveValue } from '../utils/use-responsive-value';
import type { GridProps } from './types';
import styles from './style.module.scss';

const CSS_WIDE_KEYWORDS = new Set( [
	'inherit',
	'initial',
	'unset',
	'revert',
	'revert-layer',
] );

function toCSSValue( value: string | number | undefined ) {
	return typeof value === 'number'
		? `${ value }px`
		: value?.trim() || undefined;
}

export default function useGrid(
	props: WordPressComponentProps< GridProps, 'div' >
) {
	const {
		align,
		alignment,
		className,
		columnGap,
		columns = 2,
		gap = 3,
		isInline = false,
		justify,
		rowGap,
		rows,
		style,
		templateColumns,
		templateRows,
		...otherProps
	} = useContextSystem( props, 'Grid' );

	const columnsAsArray = Array.isArray( columns ) ? columns : [ columns ];
	const column = useResponsiveValue( columnsAsArray );
	const rowsAsArray = Array.isArray( rows ) ? rows : [ rows ];
	const row = useResponsiveValue( rowsAsArray );

	const gridTemplateColumns =
		templateColumns || ( !! column && `repeat( ${ column }, 1fr )` );
	const gridTemplateRows =
		templateRows || ( !! row && `repeat( ${ row }, 1fr )` );
	const alignmentProps = getAlignmentProps( alignment );
	const values = {
		align: alignmentProps.alignItems ?? align,
		justify: alignmentProps.justifyContent ?? justify,
		'template-columns': gridTemplateColumns || undefined,
		'template-rows': gridTemplateRows || undefined,
		'row-gap': rowGap,
		'column-gap': columnGap,
	};

	return {
		...otherProps,
		className: clsx(
			styles.grid,
			{
				[ styles[ 'is-inline' ] ]: isInline,
				[ styles[ 'has-align' ] ]: !! values.align?.trim(),
				[ styles[ 'has-justify' ] ]: !! values.justify?.trim(),
				[ styles[ 'has-template-columns' ] ]: !! toCSSValue(
					values[ 'template-columns' ]
				),
				[ styles[ 'has-template-rows' ] ]: !! toCSSValue(
					values[ 'template-rows' ]
				),
			},
			// CSS-wide keywords apply to custom properties themselves. Use the
			// matching declaration instead so, for example, rowGap="inherit"
			// inherits the parent's row gap rather than its internal variable.
			Object.entries( values ).map( ( [ property, value ] ) => {
				const keyword =
					typeof value === 'string' ? value.trim().toLowerCase() : '';
				return (
					CSS_WIDE_KEYWORDS.has( keyword ) &&
					styles[ `${ property }-${ keyword }` ]
				);
			} ),
			className
		),
		style: {
			'--wp-components-grid-align': values.align,
			'--wp-components-grid-justify': values.justify,
			'--wp-components-grid-gap': gap,
			'--wp-components-grid-template-columns': toCSSValue(
				values[ 'template-columns' ]
			),
			'--wp-components-grid-template-rows': toCSSValue(
				values[ 'template-rows' ]
			),
			'--wp-components-grid-row-gap': toCSSValue( rowGap ),
			'--wp-components-grid-column-gap': toCSSValue( columnGap ),
			...style,
		},
	};
}
