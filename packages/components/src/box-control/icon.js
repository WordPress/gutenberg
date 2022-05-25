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

	const hasSide = ( value ) => {
		if ( isSideDisabled( value ) ) {
			return false;
		}

		return side === 'all' || side === value;
	};

	const top = hasSide( 'top' ) || hasSide( 'vertical' );
	const right = hasSide( 'right' ) || hasSide( 'horizontal' );
	const bottom = hasSide( 'bottom' ) || hasSide( 'vertical' );
	const left = hasSide( 'left' ) || hasSide( 'horizontal' );

	// Simulates SVG Icon scaling.
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
