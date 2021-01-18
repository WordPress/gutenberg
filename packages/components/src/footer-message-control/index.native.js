/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import FooterMessageCell from '../mobile/bottom-sheet/footer-message-cell';

const FooterMessageControl = memo( ( { ...props } ) => {
	return <FooterMessageCell { ...props } />;
} );

export default FooterMessageControl;
