/**
 * External dependencies
 */
import React from 'react';
/**
 * Internal dependencies
 */
import FooterMessageCell from '../mobile/bottom-sheet/footer-message-cell';

const FooterMessageControl = React.memo( ( { ...props } ) => {
	return <FooterMessageCell { ...props } />;
} );

export default FooterMessageControl;
