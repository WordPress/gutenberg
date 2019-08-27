/**
 * Internal dependencies
 */
import { SVG, Path } from '../';

function Tip( props ) {
	return (
		<div className="components-tip">
			<SVG width="24" height="24" viewBox="0 0 24 24">
				<Path d="M20.45 4.91L19.04 3.5l-1.79 1.8 1.41 1.41 1.79-1.8zM13 4h-2V1h2v3zm10 9h-3v-2h3v2zm-12 6.95v-3.96l-1-.58c-1.24-.72-2-2.04-2-3.46 0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.42-.77 2.74-2 3.46l-1 .58v3.96h-2zm-2 2h6v-4.81c1.79-1.04 3-2.97 3-5.19 0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2.22 1.21 4.15 3 5.19v4.81zM4 13H1v-2h3v2zm2.76-7.71l-1.79-1.8L3.56 4.9l1.8 1.79 1.4-1.4z" />
			</SVG>
			<p>{ props.children }</p>
		</div>
	);
}

export default Tip;
