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

const allSides = [ 'top', 'right', 'bottom', 'left' ];

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

	// Filter sides if custom configuration provided, maintaining default order.
	const filteredSides = sides?.length
		? allSides.filter( ( side ) => sides.includes( side ) )
		: allSides;

	const first = filteredSides[ 0 ];
	const last = filteredSides[ filteredSides.length - 1 ];
	const only = first === last && first;

	return (
		<LayoutContainer className="component-box-control__input-controls-wrapper">
			<Layout
				gap={ 0 }
				align="top"
				className="component-box-control__input-controls"
			>
				{ filteredSides.map( ( side ) => (
					<UnitControl
						{ ...props }
						isFirst={ first === side }
						isLast={ last === side }
						isOnly={ only === side }
						value={ values[ side ] }
						onChange={ createHandleOnChange( side ) }
						onFocus={ createHandleOnFocus( side ) }
						onHoverOn={ createHandleOnHoverOn( side ) }
						onHoverOff={ createHandleOnHoverOff( side ) }
						label={ LABELS[ side ] }
						key={ `box-control-${ side }` }
					/>
				) ) }
			</Layout>
		</LayoutContainer>
	);
}
