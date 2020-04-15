/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { getValues } from './utils';
import {
	Layout,
	LayoutBox,
	SideIndicatorX,
	SideIndicatorY,
} from './styles/box-control-styles';
import { useRtl } from '../utils/style-mixins';

export default function BoxInputControls( {
	onChange = noop,
	values,
	...props
} ) {
	const {
		top: [ top, unit ],
		right: [ right ],
		bottom: [ bottom ],
		left: [ left ],
	} = values;

	const allValues = getValues( values, 'top', 'right', 'bottom', 'left' );
	const isMixed = ! allValues.every( ( v ) => v === top );
	const isRtl = useRtl();

	const createHandleOnChange = ( side ) => ( next ) => {
		onChange( { ...values, [ side ]: [ next, unit ] } );
	};

	const baseStyles = {
		position: 'absolute',
		zIndex: 1,
		maxWidth: 60,
	};

	return (
		<Layout>
			<SideIndicatorX aria-hidden="true" />
			<SideIndicatorY aria-hidden="true" />
			<LayoutBox aria-hidden="true" />
			<UnitControl
				{ ...props }
				value={ top }
				dragDirection="s"
				onChange={ createHandleOnChange( 'top' ) }
				label="Top"
				size="small"
				style={ {
					...baseStyles,
					left: '50%',
					top: -5,
					transform: 'translateX(-50%)',
				} }
			/>
			<UnitControl
				{ ...props }
				value={ left }
				dragDirection="e"
				onChange={ createHandleOnChange( 'left' ) }
				label="Left"
				size="small"
				style={ {
					...baseStyles,
					position: 'absolute',
					[ isRtl ? 'right' : 'left' ]: 0,
					top: '50%',
					transform: 'translateY(calc(-50% - 3px))',
				} }
			/>
			<UnitControl
				{ ...props }
				value={ isMixed ? '' : top }
				onChange={ ( next ) => {
					onChange( {
						top: [ next, unit ],
						right: [ next, unit ],
						bottom: [ next, unit ],
						left: [ next, unit ],
					} );
				} }
				label="All"
				size="small"
				style={ {
					...baseStyles,
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, calc(-50% - 3px))',
				} }
			/>
			<UnitControl
				{ ...props }
				value={ right }
				dragDirection="w"
				onChange={ createHandleOnChange( 'right' ) }
				label="Right"
				size="small"
				style={ {
					...baseStyles,
					[ isRtl ? 'left' : 'right' ]: 0,
					top: '50%',
					transform: 'translateY(calc(-50% - 3px))',
				} }
			/>
			<UnitControl
				{ ...props }
				value={ bottom }
				dragDirection="n"
				onChange={ createHandleOnChange( 'bottom' ) }
				label="Bottom"
				size="small"
				style={ {
					...baseStyles,
					left: '50%',
					bottom: 0,
					transform: 'translateX(-50%)',
				} }
			/>
		</Layout>
	);
}
