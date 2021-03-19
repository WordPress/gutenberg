/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { LABELS } from './utils';
import { LayoutContainer, Layout } from './styles/box-control-styles';

const getFirstLastAndOnlySides = ( sides ) => {
	let first, last;

	[ 'top', 'right', 'bottom', 'left' ].forEach( ( side ) => {
		if ( sides && sides[ side ] ) {
			if ( ! first ) {
				first = side;
			}

			last = side;
		}
	} );

	const only = first === last && first;

	return { first, last, only };
};

export default function BoxInputControls( {
	onChange = noop,
	onFocus = noop,
	onHoverOn = noop,
	onHoverOff = noop,
	values,
	sides,
	...props
} ) {
	const createHandleOnFocus = ( side ) => ( event ) => {
		onFocus( event, { side } );
	};

	const createHandleOnHoverOn = ( side ) => () => {
		onHoverOn( { [ side ]: true } );
	};

	const createHandleOnHoverOff = ( side ) => () => {
		onHoverOff( { [ side ]: false } );
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

	const isSideDisabled = ( side ) => sides && sides[ side ] === false;
	const { first, last, only } = getFirstLastAndOnlySides( sides );

	return (
		<LayoutContainer className="component-box-control__input-controls-wrapper">
			<Layout
				gap={ 0 }
				align="top"
				className="component-box-control__input-controls"
			>
				{ ! isSideDisabled( 'top' ) && (
					<UnitControl
						{ ...props }
						isFirst={ first === 'top' }
						isLast={ last === 'top' }
						isOnly={ only === 'top' }
						value={ top }
						onChange={ createHandleOnChange( 'top' ) }
						onFocus={ createHandleOnFocus( 'top' ) }
						onHoverOn={ createHandleOnHoverOn( 'top' ) }
						onHoverOff={ createHandleOnHoverOff( 'top' ) }
						label={ LABELS.top }
					/>
				) }
				{ ! isSideDisabled( 'right' ) && (
					<UnitControl
						{ ...props }
						isFirst={ first === 'right' }
						isLast={ last === 'right' }
						isOnly={ only === 'right' }
						value={ right }
						onChange={ createHandleOnChange( 'right' ) }
						onFocus={ createHandleOnFocus( 'right' ) }
						onHoverOn={ createHandleOnHoverOn( 'right' ) }
						onHoverOff={ createHandleOnHoverOff( 'right' ) }
						label={ LABELS.right }
					/>
				) }
				{ ! isSideDisabled( 'bottom' ) && (
					<UnitControl
						{ ...props }
						isFirst={ first === 'bottom' }
						isLast={ last === 'bottom' }
						isOnly={ only === 'bottom' }
						value={ bottom }
						onChange={ createHandleOnChange( 'bottom' ) }
						onFocus={ createHandleOnFocus( 'bottom' ) }
						onHoverOn={ createHandleOnHoverOn( 'bottom' ) }
						onHoverOff={ createHandleOnHoverOff( 'bottom' ) }
						label={ LABELS.bottom }
					/>
				) }
				{ ! isSideDisabled( 'left' ) && (
					<UnitControl
						{ ...props }
						isFirst={ first === 'left' }
						isLast={ last === 'left' }
						isOnly={ only === 'left' }
						value={ left }
						onChange={ createHandleOnChange( 'left' ) }
						onFocus={ createHandleOnFocus( 'left' ) }
						onHoverOn={ createHandleOnHoverOn( 'left' ) }
						onHoverOff={ createHandleOnHoverOff( 'left' ) }
						label={ LABELS.left }
					/>
				) }
			</Layout>
		</LayoutContainer>
	);
}
