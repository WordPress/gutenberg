/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import useShadowStyles, { css } from '../utils/hooks/use-shadow-styles';
import { ALERT, COLORS } from '../utils/colors-values';
import { space } from '../utils/space';

const styles = css`
	:host {
		display: flex;
		color: ${ COLORS.gray[ 700 ] };
	}

	::slotted( svg ) {
		align-self: center;
		fill: ${ ALERT.yellow };
		flex-shrink: 0;
		margin-right: ${ space( 2 ) };
	}

	::slotted( p ) {
		margin: 0;
	}
`;

/**
 * @param {Object} props
 * @param {import('react').ReactNode} props.children Children to render in the tip.
 * @return {JSX.Element} Element
 */
function Tip( { children } ) {
	return (
		<div ref={ useShadowStyles( null, [ styles ] ) }>
			<SVG width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 15.8c-3.7 0-6.8-3-6.8-6.8s3-6.8 6.8-6.8c3.7 0 6.8 3 6.8 6.8s-3.1 6.8-6.8 6.8zm0-12C9.1 3.8 6.8 6.1 6.8 9s2.4 5.2 5.2 5.2c2.9 0 5.2-2.4 5.2-5.2S14.9 3.8 12 3.8zM8 17.5h8V19H8zM10 20.5h4V22h-4z" />
			</SVG>
			<p>{ children }</p>
		</div>
	);
}

export default Tip;
