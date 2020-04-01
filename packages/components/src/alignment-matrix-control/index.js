/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';
import {
	unstable_useCompositeState as useCompositeState,
	unstable_Composite as Composite,
	unstable_CompositeGroup as CompositeGroup,
} from 'reakit';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getAlignmentIndex,
	getAlignmentValueFromIndex,
	getAlignIndexFromGrid,
	mapAlignmentToGrid,
} from './utils';
import Cell from './cell';
import { Root, Row } from './styles/alignment-matrix-control-styles';
import { useControlledState } from '../utils/hooks';
import { useRTL } from '../utils/rtl';
import AlignmentMatrixControlIcon from './icon';

export default function AlignmentMatrixControl( {
	className,
	id: idProp,
	label = __( 'Alignment Matrix Control' ),
	hasFocusBorder = true,
	onChange = noop,
	value = 'center',
	...props
} ) {
	const isRTL = useRTL();
	const [ alignIndex, setAlignIndex ] = useControlledState(
		getAlignmentIndex( value )
	);

	const nodeRef = useRef();
	const instanceId = useInstanceId( AlignmentMatrixControl );
	const idPrefix = idProp || 'alignment-matrix-control';
	const id = `${ idPrefix }-${ instanceId }`;
	const currentId = `${ id }-${ alignIndex }`;

	const composite = useCompositeState( {
		currentId,
		rtl: isRTL,
		unstable_virtual: true,
		wrap: false,
	} );

	const compositeRef = useRef( composite.currentId );
	const grid = useMemo( () => mapAlignmentToGrid( { id } ), [ id ] );

	useEffect( () => {
		if ( compositeRef.current === composite.currentId ) return;

		const nextAlignIndex = getAlignIndexFromGrid(
			grid,
			composite.currentId
		);
		const alignName = getAlignmentValueFromIndex( nextAlignIndex );

		onChange( alignName );
		setAlignIndex( nextAlignIndex );

		compositeRef.current = composite.currentId;
	}, [ composite.currentId, grid, onChange ] );

	const classes = classnames(
		'component-alignment-matrix-control',
		className
	);

	return (
		<>
			<Composite
				{ ...props }
				{ ...composite }
				aria-label={ label }
				aria-labelledby={ id }
				as={ Root }
				className={ classes }
				hasFocusBorder={ hasFocusBorder }
				id={ id }
				ref={ nodeRef }
				role="listbox"
				tabIndex={ 0 }
			>
				{ grid.map( ( cells, index ) => (
					<CompositeGroup
						{ ...composite }
						as={ Row }
						role="row"
						key={ index }
					>
						{ cells.map( ( cell ) => (
							<Cell
								{ ...composite }
								isActive={ composite.currentId === cell.id }
								key={ cell.id }
								id={ cell.id }
								value={ cell.value }
							/>
						) ) }
					</CompositeGroup>
				) ) }
			</Composite>
		</>
	);
}

AlignmentMatrixControl.Icon = AlignmentMatrixControlIcon;
AlignmentMatrixControl.icon = <AlignmentMatrixControlIcon />;

AlignmentMatrixControl.__getAlignmentIndex = getAlignmentIndex;
