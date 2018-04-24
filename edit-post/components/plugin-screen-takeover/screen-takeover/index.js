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

function ScreenTakeoverHeader( { title, icon, onClose } ) {
	return (
		<NavigableToolbar
			className="screen-takeover-header"
			aria-label={ __( 'Screen Takeover Toolbar' ) }
		>
			<span>
				{ icon }
				<h2 className="header-title">{ title }</h2>
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
