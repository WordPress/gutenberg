/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import { getAlignmentProps } from './utils';
import { useResponsiveValue } from '../ui/utils/use-responsive-value';
import CONFIG from '../utils/config-values';
import { useCx } from '../utils/hooks/use-cx';
import type { GridProps } from './types';

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
		templateColumns,
		templateRows,
		...otherProps
	} = useContextSystem( props, 'Grid' );

	const columnsAsArray = Array.isArray( columns ) ? columns : [ columns ];
	const column = useResponsiveValue( columnsAsArray );
	const rowsAsArray = Array.isArray( rows ) ? rows : [ rows ];
	const row = useResponsiveValue( rowsAsArray );

	const gridTemplateColumns =
		templateColumns || ( !! columns && `repeat( ${ column }, 1fr )` );
	const gridTemplateRows =
		templateRows || ( !! rows && `repeat( ${ row }, 1fr )` );

	const cx = useCx();

	const classes = useMemo( () => {
		const alignmentProps = getAlignmentProps( alignment );

		const gridClasses = css( {
			alignItems: align,
			display: isInline ? 'inline-grid' : 'grid',
			gap: `calc( ${ CONFIG.gridBase } * ${ gap } )`,
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
		cx,
		gap,
		gridTemplateColumns,
		gridTemplateRows,
		isInline,
		justify,
		rowGap,
	] );

	return { ...otherProps, className: classes };
}
