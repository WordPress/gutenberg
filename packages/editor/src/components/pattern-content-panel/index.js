/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { ContentPanel } = unlock( patternsPrivateApis );

export default function PatternContentPanel() {
	const supportsPatternContentPanel = useSelect(
		( select ) => select( editorStore ).getCurrentPostType() === 'wp_block',
		[]
	);

	if ( ! supportsPatternContentPanel ) {
		return null;
	}

	return <ContentPanel />;
}
