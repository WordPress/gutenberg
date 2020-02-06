/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import Header from '../header';

function Layout() {
	return (
		<>
			<Header />
			<Sidebar />
			<div
				className="edit-global-styles-layout__content"
				role="region"
				aria-label={ __( 'Global styles screen content' ) }
				tabIndex="-1"
			>
				<h1>Lorem ipsum dolor sit amet, consectetur adipiscing elit</h1>
				<h2>Lorem ipsum dolor sit amet, consectetur adipiscing elit</h2>
				<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
			</div>
		</>
	);
}

export default Layout;
