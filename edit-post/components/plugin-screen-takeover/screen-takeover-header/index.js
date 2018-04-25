/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { IconButton } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	NavigableToolbar,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Creates the header for use in the screen takeover component.
 *
 * @param { string }     title      The title to be displayed in the header.
 * @param { SVGElement } icon       An svg icon to be displayed next to the header title.
 * @param { function }   onClose    The function that closes the screen takeover, as defined in the dispatch.
 *
 * @return {*} The header for the screen takeover.
 */
function ScreenTakeoverHeader( { title, icon, onClose } ) {
	return (
		<NavigableToolbar
			className="screen-takeover-header"
			aria-label={ __( 'Screen Takeover Toolbar' ) }
		>
			<span>
				{ icon }
				<h1 className="header-title">{ title }</h1>
			</span>
			<IconButton
				onClick={ onClose }
				icon="no-alt"
				label="test"
			/>
		</NavigableToolbar>
	);
}

export default compose( [
	withDispatch( ( dispatch ) => ( {
		onClose: dispatch( 'core/edit-post' ).closeScreenTakeover,
	} ) ),
] )( ScreenTakeoverHeader );
