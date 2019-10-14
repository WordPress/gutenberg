/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Toolbar from '../';
import ToolbarButton from '../../toolbar-button';
import ToolbarGroup from '../../toolbar-group';

export default { title: 'Toolbar', component: Toolbar };

export function _default() {
	const MyToolbar = () => {
		const [ thumb, setThumb ] = useState();

		const getThumbProps = ( icon ) => ( {
			icon: `thumbs-${ icon }`,
			title: `Thumbs ${ icon }`,
			isActive: thumb === icon,
			onClick: () => setThumb( thumb === icon ? null : icon ),
		} );

		return (
			<Toolbar accessibilityLabel="Options">
				<ToolbarButton { ...getThumbProps( 'up' ) } />
				<ToolbarButton { ...getThumbProps( 'down' ) } />
				<ToolbarGroup
					isCollapsed
					controls={ [ getThumbProps( 'up' ), getThumbProps( 'down' ) ] }
				/>
			</Toolbar>
		);
	};

	return <MyToolbar />;
}
