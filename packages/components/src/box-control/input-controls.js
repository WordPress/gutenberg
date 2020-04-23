/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { LABELS, getAllValue } from './utils';
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
	const { top, right, bottom, left } = values;

	const isRtl = useRtl();
	const allValue = getAllValue( values );

	const createHandleOnChange = ( side ) => ( next, { event } ) => {
		const { altKey } = event;
		const nextValues = { ...values };

		if ( side === 'all' ) {
			nextValues.top = next;
			nextValues.bottom = next;
			nextValues.left = next;
			nextValues.right = next;
		} else {
			nextValues[ side ] = next;
		}

		/**
		 * Supports changing pair sides. For example, holding the ALT key
		 * when changing the TOP will also update BOTTOM.
		 */
		if ( altKey ) {
			switch ( side ) {
				case 'top':
					nextValues.bottom = next;
					break;
				case 'bottom':
					nextValues.top = next;
					break;
				case 'left':
					nextValues.right = next;
					break;
				case 'right':
					nextValues.left = next;
					break;
			}
		}

		onChange( nextValues );
	};

	return (
		<Layout className="component-box-control__input-controls">
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
					marginTop: -5,
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
					marginTop: -5,
					bottom: 0,
					transform: 'translateX(-50%)',
				} }
			/>
		</Layout>
	);
}
