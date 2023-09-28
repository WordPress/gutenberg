/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from './cell';
import { Composite, CompositeRow, useCompositeStore } from '../composite/v2';
import { Root, Row } from './styles/alignment-matrix-control-styles';
import AlignmentMatrixControlIcon from './icon';
import { GRID, getItemId, getItemValue } from './utils';
import type { WordPressComponentProps } from '../ui/context';
import type {
	AlignmentMatrixControlProps,
	AlignmentMatrixControlValue,
	VoidableAlignmentMatrixControlValue,
} from './types';

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

	const compositeStore = useCompositeStore( {
		defaultActiveId: getItemId( baseId, defaultValue ),
		activeId: getItemId( baseId, value ),
		setActiveId: ( nextActiveId ) => {
			onChange?.(
				getItemValue(
					baseId,
					nextActiveId as VoidableAlignmentMatrixControlValue
				) as AlignmentMatrixControlValue
			);
		},
		rtl: isRTL(),
	} );

	const activeId = compositeStore.useState( 'activeId' );

	const classes = classnames(
		'component-alignment-matrix-control',
		className
	);

	return (
		<Composite
			{ ...props }
			store={ compositeStore }
			aria-label={ label }
			as={ Root }
			id={ baseId }
			className={ classes }
			role="grid"
			size={ width }
		>
			{ GRID.map( ( cells, index ) => (
				<CompositeRow as={ Row } role="row" key={ index }>
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
				</CompositeRow>
			) ) }
		</Composite>
	);
}

AlignmentMatrixControl.Icon = AlignmentMatrixControlIcon;

export default AlignmentMatrixControl;
