/**
 * External dependencies
 */
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
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getAlignmentIndex } from './utils';
import Cell from './cell';
import { Root, Row } from './styles/alignment-matrix-control-styles';
import { useRTL } from '../utils/rtl';
import AlignmentMatrixControlIcon from './icon';

const grid = [
	[ 'top left', 'top center', 'top right' ],
	[ 'center left', 'center center', 'center right' ],
	[ 'bottom left', 'bottom center', 'bottom right' ],
];

function useBaseId( id ) {
	const instanceId = useInstanceId( AlignmentMatrixControl );
	const prefix = id || 'alignment-matrix-control';
	return `${ prefix }-${ instanceId }`;
}

function parseValue( value ) {
	return value === 'center' ? 'center-center' : value.replace( ' ', '-' );
}

function getItemId( id, value ) {
	return `${ id }-${ parseValue( value ) }`;
}

export default function AlignmentMatrixControl( {
	className,
	id,
	label = __( 'Alignment Matrix Control' ),
	hasFocusBorder = true,
	defaultValue = 'center center',
	value,
	onChange,
	...props
} ) {
	const [ immutableDefaultValue ] = useState( value ?? defaultValue );
	const isRTL = useRTL();
	const baseId = useBaseId( id );
	const initialCurrentId = getItemId( baseId, immutableDefaultValue );

	const composite = useCompositeState( {
		baseId,
		currentId: initialCurrentId,
		rtl: isRTL,
	} );

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
			hasFocusBorder={ hasFocusBorder }
			role="grid"
		>
			{ grid.map( ( cells, index ) => (
				<CompositeGroup
					{ ...composite }
					as={ Row }
					role="row"
					key={ index }
				>
					{ cells.map( ( cell ) => {
						const cellId = getItemId( baseId, cell );
						return (
							<Cell
								{ ...composite }
								isActive={ composite.currentId === cellId }
								key={ cell }
								id={ cellId }
								value={ cell }
								onFocus={ () => onChange?.( cell ) }
								onClick={ () =>
									// VoiceOver doesn't focus elements on click
									composite.move( cellId )
								}
							/>
						);
					} ) }
				</CompositeGroup>
			) ) }
		</Composite>
	);
}

AlignmentMatrixControl.Icon = AlignmentMatrixControlIcon;
AlignmentMatrixControl.icon = <AlignmentMatrixControlIcon />;

AlignmentMatrixControl.__getAlignmentIndex = getAlignmentIndex;
