/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from './cell';
import { Composite } from '../composite';
import AlignmentMatrixControlIcon from './icon';
import { GRID, getItemId, getItemValue } from './utils';
import type { WordPressComponentProps } from '../context';
import type { AlignmentMatrixControlProps } from './types';
import styles from './style.module.scss';

function UnforwardedAlignmentMatrixControl( {
	className,
	id,
	label = __( 'Alignment Matrix Control' ),
	defaultValue = 'center center',
	value,
	onChange,
	width = 92,
	...props
}: WordPressComponentProps< AlignmentMatrixControlProps, 'div', false > ) {
	const baseId = useInstanceId(
		UnforwardedAlignmentMatrixControl,
		'alignment-matrix-control',
		id
	);

	const setActiveId = useCallback<
		NonNullable< React.ComponentProps< typeof Composite >[ 'setActiveId' ] >
	>(
		( nextActiveId ) => {
			const nextValue = getItemValue( baseId, nextActiveId );
			if ( nextValue ) {
				onChange?.( nextValue );
			}
		},
		[ baseId, onChange ]
	);

	const classes = clsx(
		'component-alignment-matrix-control',
		styles[ 'grid-container' ],
		className
	);

	return (
		<Composite
			defaultActiveId={ getItemId( baseId, defaultValue ) }
			activeId={ getItemId( baseId, value ) }
			setActiveId={ setActiveId }
			rtl={ isRTL() }
			render={
				<div
					{ ...props }
					className={ classes }
					aria-label={ label }
					id={ baseId }
					role="grid"
					style={ { width: `${ width }px` } }
				/>
			}
		>
			{ GRID.map( ( cells, index ) => (
				<Composite.Row
					render={
						<div className={ styles[ 'grid-row' ] } role="row" />
					}
					key={ index }
				>
					{ cells.map( ( cell ) => (
						<Cell
							id={ getItemId( baseId, cell ) }
							key={ cell }
							value={ cell }
						/>
					) ) }
				</Composite.Row>
			) ) }
		</Composite>
	);
}

/**
 * AlignmentMatrixControl components enable adjustments to horizontal and vertical alignments for UI.
 *
 * ```jsx
 * import { AlignmentMatrixControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const Example = () => {
 * 	const [ alignment, setAlignment ] = useState( 'center center' );
 *
 * 	return (
 * 		<AlignmentMatrixControl
 * 			value={ alignment }
 * 			onChange={ setAlignment }
 * 		/>
 * 	);
 * };
 * ```
 */
export const AlignmentMatrixControl = Object.assign(
	UnforwardedAlignmentMatrixControl,
	{
		/**
		 * Render an alignment matrix as an icon.
		 *
		 * ```jsx
		 * import { AlignmentMatrixControl } from '@wordpress/components';
		 *
		 * <Icon icon={<AlignmentMatrixControl.Icon value="top left" />} />
		 * ```
		 */
		Icon: Object.assign( AlignmentMatrixControlIcon, {
			displayName: 'AlignmentMatrixControl.Icon',
		} ),
	}
);

export default AlignmentMatrixControl;
