/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { navigateRegions } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetArea from '../widget-area';

function Layout() {
	const areas = [
		__( 'Sidebar' ),
		__( 'Footer' ),
		__( 'Header' ),
	];

	return (
		<Fragment>
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
						<WidgetArea title={ area } initialOpen={ index === 0 } />
					</div>
				) ) }
			</div>
		</Fragment>
	);
}

export default navigateRegions( Layout );
