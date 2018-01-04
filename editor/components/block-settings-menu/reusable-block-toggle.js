/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { isReusableBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getBlock } from '../../store/selectors';
import { convertBlockToStatic, convertBlockToReusable } from '../../store/actions';

export function ReusableBlockToggle( { isReusable, convertToStatic, convertToReusable } ) {
	return (
		<IconButton
			className="editor-block-settings-menu__control"
			icon="controls-repeat"
			onClick={ isReusable ? convertToStatic : convertToReusable }
		>
			{ isReusable ? __( 'Detach from Reusable Block' ) : __( 'Convert to Reusable Block' ) }
		</IconButton>
	);
}

export default connect(
	( state, { uid } ) => {
		const block = getBlock( state, uid );
		return {
			isReusable: isReusableBlock( block ),
		};
	},
	( dispatch, { uid, onToggle = noop } ) => ( {
		convertToStatic() {
			dispatch( convertBlockToStatic( uid ) );
			onToggle();
		},
		convertToReusable() {
			dispatch( convertBlockToReusable( uid ) );
			onToggle();
		},
	} )
)( ReusableBlockToggle );
