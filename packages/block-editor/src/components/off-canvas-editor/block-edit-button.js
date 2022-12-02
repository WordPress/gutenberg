/**
 * WordPress dependencies
 */
import { edit } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default forwardRef( function BlockEditButton(
	{ clientId, ...props },
	ref
) {
	const {
		selectBlock,
		__unstableSetInspectorControlsTabSelectedTab:
			setInspectorControlsTabSelectedTab,
	} = useDispatch( blockEditorStore );

	const onClick = () => {
		selectBlock( clientId );
		setInspectorControlsTabSelectedTab( 'settings' );
	};

	return (
		<Button { ...props } ref={ ref } icon={ edit } onClick={ onClick } />
	);
} );
