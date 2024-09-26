/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockElementRef } from '../block-list/use-block-props/use-block-refs';

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/skip-to-selected-block/README.md
 */
export default function SkipToSelectedBlock() {
	const selectedBlockClientId = useSelect(
		( select ) => select( blockEditorStore ).getBlockSelectionStart(),
		[]
	);
	const ref = useRef();
	useBlockElementRef( selectedBlockClientId, ref );
	const onClick = () => {
		ref.current?.focus();
	};

	return selectedBlockClientId ? (
		<Button
			// TODO: Switch to `true` (40px size) if possible
			__next40pxDefaultSize={ false }
			variant="secondary"
			className="block-editor-skip-to-selected-block"
			onClick={ onClick }
		>
			{ __( 'Skip to the selected block' ) }
		</Button>
	) : null;
}
