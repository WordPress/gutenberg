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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from './cell';
import { Composite, CompositeRow, useCompositeState } from '../composite2';
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
	const defaultActiveId = getItemId( baseId, immutableDefaultValue );
	const activeId =
		value !== undefined ? getItemId( baseId, value ) : undefined;

	const composite = useCompositeState( {
		defaultActiveId,
		activeId,
		rtl: isRTL(),
	} );

	const classes = classnames(
		'component-alignment-matrix-control',
		className
	);

	return (
		<Composite
			{ ...props }
			state={ composite }
			aria-label={ label }
			as={ Root }
			className={ classes }
			role="grid"
			width={ width }
		>
			{ GRID.map( ( cells, index ) => (
				<CompositeRow as={ Row } role="row" key={ index }>
					{ cells.map( ( cell ) => {
						const cellId = getItemId( baseId, cell );
						const isActive = composite.activeId === cellId;
						return (
							<Cell
								id={ cellId }
								isActive={ isActive }
								key={ cell }
								value={ cell }
								onFocus={ () => onChange( cell ) }
								tabIndex={ isActive ? 0 : -1 }
							/>
						);
					} ) }
				</CompositeRow>
			) ) }
		</Composite>
	);
}

AlignmentMatrixControl.Icon = AlignmentMatrixControlIcon;
