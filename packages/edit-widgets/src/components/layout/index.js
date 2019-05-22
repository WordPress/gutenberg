/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { navigateRegions } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
import WidgetAreas from '../widget-areas';

function Layout( { blockEditorSettings } ) {
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
				<WidgetAreas
					blockEditorSettings={ blockEditorSettings }
				/>
			</div>
		</>
	);
}

export default navigateRegions( Layout );
