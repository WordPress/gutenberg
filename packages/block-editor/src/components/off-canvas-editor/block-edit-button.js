/**
 * WordPress dependencies
 */
import { edit } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const BlockEditButton = ( { label, clientId } ) => {
	const { selectBlock } = useDispatch( blockEditorStore );

	const onClick = () => {
		selectBlock( clientId );
	};

	return <Button icon={ edit } label={ label } onClick={ onClick } />;
};

export default BlockEditButton;
