/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Layout from './components/layout';

const { wp } = window;

const createCustomizerControl = ( { settings } ) =>
	wp.customize.Control.extend( {
		ready() {
			render(
				<Layout blockEditorSettings={ settings } isInCustomizer />,
				this.container[ 0 ]
			);
		},
	} );

export default createCustomizerControl;
