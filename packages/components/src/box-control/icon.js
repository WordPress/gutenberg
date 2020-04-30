/**
 * External dependencies
 */
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
	sides = [ 'all' ],
	...props
} ) {
	const top = getSide( sides, 'top' );
	const right = getSide( sides, 'right' );
	const bottom = getSide( sides, 'bottom' );
	const left = getSide( sides, 'left' );

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

function getSide( sides, value ) {
	const match = value.toLowerCase();

	return sides.find( ( side ) => {
		const sideValue = side.toLowerCase();
		return [ 'all', match ].includes( sideValue );
	} );
}
