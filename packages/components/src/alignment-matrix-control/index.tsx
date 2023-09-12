/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from './cell';
import { Composite, CompositeRow, useCompositeStore } from '../composite/v2';
import { Root, Row } from './styles/alignment-matrix-control-styles';
import AlignmentMatrixControlIcon from './icon';
import { GRID, getItemId, normalizeValue } from './utils';
import type { WordPressComponentProps } from '../ui/context';
import type {
	AlignmentMatrixControlProps,
	AlignmentMatrixControlValue,
} from './types';

const noop = () => {};

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
	onChange = noop,
	width = 92,
	...props
}: WordPressComponentProps< AlignmentMatrixControlProps, 'div', false > ) {
	const [ immutableDefaultValue ] = useState(
		normalizeValue( value ?? defaultValue )
	);
	const currentCell = normalizeValue( value ?? immutableDefaultValue );

	const baseId = useInstanceId(
		AlignmentMatrixControl,
		'alignment-matrix-control',
		id
	);
	const defaultActiveId = getItemId( baseId, immutableDefaultValue );

	const handleOnChange = ( nextValue: AlignmentMatrixControlValue ) => {
		onChange( nextValue );
	};

	const compositeStore = useCompositeStore( {
		defaultActiveId,
		rtl: isRTL(),
	} );

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
						const isActive = cell === currentCell;

						return (
							<Cell
								id={ cellId }
								isActive={ isActive }
								key={ cell }
								value={ cell }
								onFocus={ () => handleOnChange( cell ) }
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
