/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { connection } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function BlockBindingsButton( { clientId } ) {
	const { blockAttributes } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return {
				blockAttributes: getBlockAttributes( clientId ),
			};
		},
		[ clientId ]
	);

	return blockAttributes?.metadata?.bindings ? (
		<ToolbarButton
			icon={ connection }
			label={ _x(
				// TODO: Let's get this naming right
				'Connected to a block bindings source',
				'block toolbar button label'
			) }
			iconSize={ 24 }
		></ToolbarButton>
	) : null;
}
