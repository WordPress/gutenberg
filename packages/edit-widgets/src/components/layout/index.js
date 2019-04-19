/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { navigateRegions } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetArea from '../widget-area';

function Layout( { areas } ) {
	return (
		<>
			<Header />
			<Sidebar />
			<div
				className="edit-widgets-layout__content"
				role="region"
				aria-label={ __( 'Widgets screen content' ) }
				tabIndex="-1"
			>
				{ areas.map( ( area, index ) => (
					<div key={ index } className="edit-widgets-layout__area">
						<WidgetArea area={ area } initialOpen={ index === 0 } />
					</div>
				) ) }
			</div>
		</>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { getWidgetAreas } = select( 'core/edit-widgets' );
		const areas = getWidgetAreas();
		return {
			areas,
		};
	} ),
	navigateRegions,
] )( Layout );
