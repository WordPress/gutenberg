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

/**
 * Internal dependencies
 */
import { getBlock } from '../../selectors';
import { convertBlockToStatic, convertBlockToReusable } from '../../actions';

export function ReusableBlockToggle( { block, convertToStatic, convertToReusable } ) {
	const isReusableBlock = block.name === 'core/reusable-block';

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			icon="controls-repeat"
			onClick={ isReusableBlock ? convertToStatic : convertToReusable }
		>
			{ isReusableBlock ? __( 'Detach from Reusable Block' ) : __( 'Make into a Reusable Block' ) }
		</IconButton>
	);
}

export default connect(
	( state, { uid } ) => {
		return {
			block: getBlock( state, uid ),
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
