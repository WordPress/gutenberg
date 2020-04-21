/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { LABELS, getValues } from './utils';
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

	const isRtl = useRtl();

	const allValues = getValues( values, 'top', 'right', 'bottom', 'left' );
	const isMixed = ! allValues.every( ( v ) => v === top );
	const allValue = isMixed ? '' : top;

	const createHandleOnChange = ( side ) => ( next, { event } ) => {
		const { altKey } = event;
		const nextValues = values;
		const nextValue = [ next, unit ];

		nextValues[ side ] = nextValue;

		if ( side === 'all' ) {
			nextValues.top = nextValue;
			nextValues.bottom = nextValue;
			nextValues.left = nextValue;
			nextValues.right = nextValue;
		}

		/**
		 * Supports changing pair sides. For example, holding the ALT key
		 * when changing the TOP will also update BOTTOM.
		 */
		if ( altKey ) {
			switch ( side ) {
				case 'top':
					nextValues.bottom = nextValue;
					break;
				case 'bottom':
					nextValues.top = nextValue;
					break;
				case 'left':
					nextValues.right = nextValue;
					break;
				case 'right':
					nextValues.left = nextValue;
					break;
			}
		}

		onChange( nextValues );
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
				label={ LABELS.top }
				style={ {
					left: '50%',
					transform: 'translateX(-50%)',
				} }
			/>
			<UnitControl
				{ ...props }
				value={ left }
				dragDirection="e"
				onChange={ createHandleOnChange( 'left' ) }
				label={ LABELS.left }
				style={ {
					position: 'absolute',
					[ isRtl ? 'right' : 'left' ]: 0,
					top: '50%',
					transform: 'translateY(-50%)',
				} }
			/>
			<UnitControl
				{ ...props }
				value={ allValue }
				onChange={ createHandleOnChange( 'all' ) }
				label={ LABELS.all }
				style={ {
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, -50%)',
				} }
			/>
			<UnitControl
				{ ...props }
				value={ right }
				dragDirection="w"
				onChange={ createHandleOnChange( 'right' ) }
				label={ LABELS.right }
				style={ {
					[ isRtl ? 'left' : 'right' ]: 0,
					top: '50%',
					transform: 'translateY(-50%)',
				} }
			/>
			<UnitControl
				{ ...props }
				value={ bottom }
				dragDirection="n"
				onChange={ createHandleOnChange( 'bottom' ) }
				label={ LABELS.bottom }
				style={ {
					left: '50%',
					bottom: 0,
					transform: 'translateX(-50%)',
				} }
			/>
		</Layout>
	);
}
