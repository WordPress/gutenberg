/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { css, cx, useResponsiveValue } from '@wp-g2/styles';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getAlignmentProps } from './utils';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'div'>} props
 */
export default function useGrid( props ) {
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
		templateColumns,
		templateRows,
		...otherProps
	} = useContextSystem( props, 'Grid' );

	const columnsAsArray = Array.isArray( columns ) ? columns : [ columns ];
	const column = useResponsiveValue( columnsAsArray );
	const rowsAsArray = Array.isArray( rows ) ? rows : [ rows ];
	const row = useResponsiveValue( rowsAsArray );

	const gridTemplateColumns =
		templateColumns || ( !! columns && `repeat(${ column }, 1fr)` );
	const gridTemplateRows =
		templateRows || ( !! rows && `repeat(${ row }, 1fr)` );

	const classes = useMemo( () => {
		const alignmentProps = getAlignmentProps( alignment );

		const gridClasses = css( {
			alignItems: align,
			display: isInline ? 'inline-grid' : 'grid',
			gap,
			gridTemplateColumns: gridTemplateColumns || undefined,
			gridTemplateRows: gridTemplateRows || undefined,
			gridRowGap: rowGap,
			gridColumnGap: columnGap,
			justifyContent: justify,
			verticalAlign: isInline ? 'middle' : undefined,
			...alignmentProps,
		} );

		return cx( gridClasses, className );
	}, [
		align,
		alignment,
		className,
		columnGap,
		gap,
		gridTemplateColumns,
		gridTemplateRows,
		isInline,
		justify,
		rowGap,
	] );

	return { ...otherProps, className: classes };
}
