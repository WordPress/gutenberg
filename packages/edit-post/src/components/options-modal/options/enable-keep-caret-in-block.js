/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BaseOption from './base';

export default function EnableKeepCaretInBlock( props ) {
	const { setKeepCaretInsideBlock } = useDispatch( 'core/block-editor' );
	const keepCaretInsideBlock = useSelect(
		( select ) => select( 'core/block-editor' ).keepCaretInsideBlock(),
		[]
	);

	return (
		<BaseOption
			onChange={ setKeepCaretInsideBlock }
			isChecked={ keepCaretInsideBlock }
			{ ...props }
		/>
	);
}
