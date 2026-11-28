/**
 * External dependencies
 */
import type { ReactElement, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { cloneElement, useId } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { FlexiGridProps, FlexiGridCellProps } from './types';
import { getValidChildren } from '../utils/get-valid-children';
import { useInstanceId } from '@wordpress/compose';

export function useFlexiGrid( { minCellWidth, ...props }: FlexiGridProps ) {
	const preferredId =
		'id' in props ? ( props.id as HTMLElement[ 'id' ] ) : undefined;
	const id = useInstanceId( useFlexiGrid, 'flexigrid', preferredId );

	let cells: ReturnType< typeof getValidChildren > = [];
	if ( 'children' in props ) {
		cells = getValidChildren( props.children as ReactNode ).map(
			( child, index ) =>
				cloneElement( child as unknown as ReactElement, {
					id: `${ id }-cell-${ index }`,
					key: `${ id }-cell-${ index }`,
				} )
		);
		delete props.children;
	}

	return { ...props, id, cells };
}

export function useFlexiGridCell( props: FlexiGridCellProps ) {
	const generatedId = useId();
	const { id = generatedId, ...rest } = props;
	return { id, ...rest };
}
