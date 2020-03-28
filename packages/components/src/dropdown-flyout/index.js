/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MenuItem from '../menu-item';

function Flyout( { children } ) {
	return <div className="flyout">{ children }</div>;
}

function DropdownFlyout( { label, children } ) {
	const [ isVisible, setIsVisible ] = useState( false );

	return (
		<>
			<MenuItem
				onMouseEnter={ () => setIsVisible( true ) }
				onMouseLeave={ () => setIsVisible( false ) }
			>
				{ label }
			</MenuItem>
			{ isVisible && <Flyout position="right">{ children }</Flyout> }
		</>
	);
}

export default DropdownFlyout;
