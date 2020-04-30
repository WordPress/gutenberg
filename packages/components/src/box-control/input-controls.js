/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { LABELS, useBoxControlState } from './utils';
import { LayoutContainer, Layout } from './styles/box-control-styles';

export default function BoxInputControls( {
	isLinked = true,
	onChange = noop,
	onFocus = noop,
	values: valuesProp,
	...props
} ) {
	const values = useBoxControlState( valuesProp );

	const createHandleOnFocus = ( side ) => ( event ) => {
		onFocus( event, { side } );
	};

	const handleOnChange = ( nextValues ) => {
		onChange( nextValues );
	};

	const { top, right, bottom, left } = values;

	const createHandleOnChange = ( side ) => ( next, { event } ) => {
		const { altKey } = event;
		const nextValues = { ...values };

		nextValues[ side ] = next;

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

		handleOnChange( nextValues );
	};

	/**
	 * All sides
	 */
	if ( isLinked ) return null;

	return (
		<LayoutContainer className="component-box-control__input-controls-wrapper">
			<Layout
				gap={ 0 }
				align="top"
				className="component-box-control__input-controls"
			>
				<UnitControl
					{ ...props }
					isFirst
					value={ top }
					onChange={ createHandleOnChange( 'top' ) }
					onFocus={ createHandleOnFocus( 'top' ) }
					label={ LABELS.top }
				/>
				<UnitControl
					{ ...props }
					value={ right }
					onChange={ createHandleOnChange( 'right' ) }
					onFocus={ createHandleOnFocus( 'right' ) }
					label={ LABELS.right }
				/>
				<UnitControl
					{ ...props }
					value={ bottom }
					onChange={ createHandleOnChange( 'bottom' ) }
					onFocus={ createHandleOnFocus( 'bottom' ) }
					label={ LABELS.bottom }
				/>
				<UnitControl
					{ ...props }
					isLast
					value={ left }
					onChange={ createHandleOnChange( 'left' ) }
					onFocus={ createHandleOnFocus( 'left' ) }
					label={ LABELS.left }
				/>
			</Layout>
		</LayoutContainer>
	);
}
