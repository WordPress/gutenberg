/**
 * Internal dependencies
 */
import {
	Root,
	Viewbox,
	TopStroke,
	RightStroke,
	BottomStroke,
	LeftStroke,
} from './styles/box-control-icon-styles';

const BASE_ICON_SIZE = 24;

export default function BoxControlIcon( {
	size = 24,
	side = 'all',
	sides,
	...props
} ) {
	const isSideDisabled = ( value ) =>
		sides?.length && ! sides.includes( value );

	const getSide = ( value ) => {
		if ( isSideDisabled( value ) ) {
			return false;
		}

		return side === 'all' || side === value;
	};

	const top = getSide( 'top' );
	const right = getSide( 'right' );
	const bottom = getSide( 'bottom' );
	const left = getSide( 'left' );

	// Simulates SVG Icon scaling
	const scale = size / BASE_ICON_SIZE;

	return (
		<Root style={ { transform: `scale(${ scale })` } } { ...props }>
			<Viewbox>
				<TopStroke isFocused={ top } />
				<RightStroke isFocused={ right } />
				<BottomStroke isFocused={ bottom } />
				<LeftStroke isFocused={ left } />
			</Viewbox>
		</Root>
	);
}
