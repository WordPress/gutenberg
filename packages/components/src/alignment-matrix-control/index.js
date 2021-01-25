/**
 * External dependencies
 */
import { noop } from 'lodash';
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

function useBaseId( id ) {
	const instanceId = useInstanceId(
		AlignmentMatrixControl,
		'alignment-matrix-control'
	);

	return id || instanceId;
}

export default function AlignmentMatrixControl( {
	className,
	id,
	label = __( 'Alignment Matrix Control' ),
	defaultValue = 'center center',
	value,
	onChange = noop,
	width = 92,
	...props
} ) {
	const [ immutableDefaultValue ] = useState( value ?? defaultValue );
	const baseId = useBaseId( id );
	const initialCurrentId = getItemId( baseId, immutableDefaultValue );

	const composite = useCompositeState( {
		baseId,
		currentId: initialCurrentId,
		rtl: isRTL(),
	} );

	const handleOnChange = ( nextValue ) => {
		onChange( nextValue );
	};

	useEffect( () => {
		if ( typeof value !== 'undefined' ) {
			composite.setCurrentId( getItemId( baseId, value ) );
		}
	}, [ value, composite.setCurrentId ] );

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
			width={ width }
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
