/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from './cell';
import { Composite, CompositeGroup, useCompositeState } from '../composite';
import { Root, Row } from './styles/alignment-matrix-control-styles';
import AlignmentMatrixControlIcon from './icon';
import { GRID, getItemId } from './utils';
import type { WordPressComponentProps } from '../ui/context';
import type {
	AlignmentMatrixControlProps,
	AlignmentMatrixControlValue,
} from './types';

const noop = () => {};

function useBaseId( id?: string ) {
	const instanceId = useInstanceId(
		AlignmentMatrixControl,
		'alignment-matrix-control'
	);

	return id || instanceId;
}

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
	const [ immutableDefaultValue ] = useState( value ?? defaultValue );
	const baseId = useBaseId( id );
	const initialCurrentId = getItemId( baseId, immutableDefaultValue );

	const composite = useCompositeState( {
		baseId,
		currentId: initialCurrentId,
		rtl: isRTL(),
	} );

	const handleOnChange = ( nextValue: AlignmentMatrixControlValue ) => {
		onChange( nextValue );
	};

	const { setCurrentId } = composite;

	useEffect( () => {
		if ( typeof value !== 'undefined' ) {
			setCurrentId( getItemId( baseId, value ) );
		}
	}, [ value, setCurrentId, baseId ] );

	const classes = classnames(
		'component-alignment-matrix-control',
		className
	);

	return (
		<Composite
			{ ...props }
			{ ...composite }
			aria-label={ label }
			as={ Root }
			className={ classes }
			role="grid"
			size={ width }
		>
			{ GRID.map( ( cells, index ) => (
				<CompositeGroup
					{ ...composite }
					as={ Row }
					role="row"
					key={ index }
				>
					{ cells.map( ( cell ) => {
						const cellId = getItemId( baseId, cell );
						const isActive = composite.currentId === cellId;

						return (
							<Cell
								{ ...composite }
								id={ cellId }
								isActive={ isActive }
								key={ cell }
								value={ cell }
								onFocus={ () => handleOnChange( cell ) }
								tabIndex={ isActive ? 0 : -1 }
							/>
						);
					} ) }
				</CompositeGroup>
			) ) }
		</Composite>
	);
}

AlignmentMatrixControl.Icon = AlignmentMatrixControlIcon;

export default AlignmentMatrixControl;
