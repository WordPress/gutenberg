/**
 * WordPress dependencies
 */
import { Icon, tip } from '@wordpress/icons';

/**
 * @typedef Props
 * @property {import('react').ReactNode} children Children to render in the tip.
 */

/**
 * @param {Props} props
 * @return {JSX.Element} Element
 */
function Tip( props ) {
	return (
		<div className="components-tip">
			<Icon icon={ tip } />
			<p>{ props.children }</p>
		</div>
	);
}

export default Tip;
