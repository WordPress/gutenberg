/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

function Menu( { page, onNavigate } ) {
	return (
		<div className="menu">
			<Button
				isToggled={ page === 'editor' }
				onClick={ () => onNavigate( 'editor' ) }
			>
				Editor
			</Button>
			<Button
				isToggled={ page === 'components' }
				onClick={ () => onNavigate( 'components' ) }
			>
				Components
			</Button>
		</div>
	);
}

export default Menu;
