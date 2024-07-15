/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from './cell';
import * as Composite from '../composite';
import { Root, Row } from './styles/alignment-matrix-control-styles';
import AlignmentMatrixControlIcon from './icon';
import { GRID, getItemId, getItemValue } from './utils';
import type { WordPressComponentProps } from '../context';
import type { AlignmentMatrixControlProps } from './types';

/**
 *
 * AlignmentMatrixControl components enable adjustments to horizontal and vertical alignments for UI.
 *
 * ```jsx
 * import { __experimentalAlignmentMatrixControl as AlignmentMatrixControl } from '@wordpress/components';
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
export function AlignmentMatrixControl( {
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
		AlignmentMatrixControl,
		'alignment-matrix-control',
		id
	);

	const compositeStore = Composite.useStore( {
		defaultActiveId: getItemId( baseId, defaultValue ),
		activeId: getItemId( baseId, value ),
		setActiveId: ( nextActiveId ) => {
			const nextValue = getItemValue( baseId, nextActiveId );
			if ( nextValue ) {
				onChange?.( nextValue );
			}
		},
		rtl: isRTL(),
	} );

	const activeId = compositeStore.useState( 'activeId' );

	const classes = clsx( 'component-alignment-matrix-control', className );

	return (
		<Composite.Root
			store={ compositeStore }
			render={
				<Root
					{ ...props }
					aria-label={ label }
					className={ classes }
					id={ baseId }
					role="grid"
					size={ width }
				/>
			}
		>
			{ GRID.map( ( cells, index ) => (
				<Composite.Row render={ <Row role="row" /> } key={ index }>
					{ cells.map( ( cell ) => {
						const cellId = getItemId( baseId, cell );
						const isActive = cellId === activeId;

						return (
							<Cell
								id={ cellId }
								isActive={ isActive }
								key={ cell }
								value={ cell }
							/>
						);
					} ) }
				</Composite.Row>
			) ) }
		</Composite.Root>
	);
}

AlignmentMatrixControl.Icon = AlignmentMatrixControlIcon;

export default AlignmentMatrixControl;
