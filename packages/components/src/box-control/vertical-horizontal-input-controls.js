/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { LABELS } from './utils';

const groupedSides = [ 'vertical', 'horizontal' ];

export default function VerticalHorizontalInputControls( {
	onChange = noop,
	onFocus = noop,
	onHoverOn = noop,
	onHoverOff = noop,
	values,
	sides,
	...props
} ) {
	const createHandleOnFocus = ( side ) => ( event ) => {
		// TODO: Check if this is okay.
		onFocus( event, { side } );
	};

	const createHandleOnHoverOn = ( side ) => () => {
		if ( side === 'vertical' ) {
			onHoverOn( {
				top: true,
				bottom: true,
				left: false,
				right: false,
			} );
		} else {
			onHoverOn( {
				top: false,
				bottom: false,
				left: true,
				right: true,
			} );
		}
	};

	const createHandleOnHoverOff = ( side ) => () => {
		if ( side === 'vertical' ) {
			onHoverOff( {
				top: true,
				bottom: true,
				left: false,
				right: false,
			} );
		} else {
			onHoverOff( {
				top: false,
				bottom: false,
				left: true,
				right: true,
			} );
		}
	};

	const handleOnChange = ( nextValues ) => {
		onChange( nextValues );
	};

	const createHandleOnChange = ( side ) => ( next ) => {
		const nextValues = { ...values };

		if ( side === 'vertical' ) {
			nextValues.top = next;
			nextValues.bottom = next;
		}
		if ( side === 'horizontal' ) {
			nextValues.left = next;
			nextValues.right = next;
		}

		handleOnChange( nextValues );
	};

	// Filter sides if custom configuration provided, maintaining default order.
	// const filteredSides = sides?.length
	// 	? allSides.filter( ( side ) => sides.includes( side ) )
	// 	: allSides;

	// TODO: Allow filtering of sides so that you can have it be just vertical or just horizontal

	const filteredSides = groupedSides;

	const first = filteredSides[ 0 ];
	const last = filteredSides[ filteredSides.length - 1 ];
	const only = first === last && first;

	return (
		<>
			{ filteredSides.map( ( side ) => (
				<UnitControl
					{ ...props }
					isFirst={ first === side }
					isLast={ last === side }
					isOnly={ only === side }
					value={ 'vertical' === side ? values.top : values.left }
					onChange={ createHandleOnChange( side ) }
					onFocus={ createHandleOnFocus( side ) }
					onHoverOn={ createHandleOnHoverOn( side ) }
					onHoverOff={ createHandleOnHoverOff( side ) }
					label={ LABELS[ side ] }
					key={ `box-control-${ side }` }
				/>
			) ) }
		</>
	);
}
