/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockRef } from '../block-list/use-block-props/use-block-refs';

const SkipToSelectedBlock = ( { selectedBlockClientId } ) => {
	const ref = useRef();
	const onClick = () => {
		ref.current.focus();
	};

	useBlockRef( selectedBlockClientId, ref );

	return selectedBlockClientId ? (
		<Button
			isSecondary
			className="block-editor-skip-to-selected-block"
			onClick={ onClick }
		>
			{ __( 'Skip to the selected block' ) }
		</Button>
	) : null;
};

export default withSelect( ( select ) => {
	return {
		selectedBlockClientId: select(
			blockEditorStore
		).getBlockSelectionStart(),
	};
} )( SkipToSelectedBlock );
