/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

export default function PageContent() {
	const clientIdsTree = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getEnabledClientIdsTree(),
		[]
	);
	const clientIds = useMemo(
		() => clientIdsTree.map( ( { clientId } ) => clientId ),
		[ clientIdsTree ]
	);
	return <BlockQuickNavigation clientIds={ clientIds } />;
}
