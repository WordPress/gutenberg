/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';

const Navigation = ( { active, children } ) => {
	return (
		<div className="components-navigation">
			{ Children.map( children, ( child ) =>
				child ? cloneElement( child, { active } ) : null
			) }
		</div>
	);
};

export default Navigation;
