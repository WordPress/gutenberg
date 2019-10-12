/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Toolbar from '../';
import ToolbarButton from '../../toolbar-button';

export default { title: 'Toolbar', component: Toolbar };

export function _default() {
	const MyToolbar = () => {
		const [ active, setActive ] = useState();

		const createToolbarButton = ( thumbs ) => (
			<ToolbarButton
				key={ thumbs }
				icon={ `thumbs-${ thumbs }` }
				title={ `Thumbs ${ thumbs }` }
				isActive={ active === thumbs }
				onClick={ () => setActive( thumbs ) }
			/>
		);

		return (
			<Toolbar label="Card options">
				{ [ 'up', 'down' ].map( createToolbarButton ) }
			</Toolbar>
		);
	};

	return <MyToolbar />;
}
