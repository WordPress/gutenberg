/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import WelcomeGuideZoomOut from './zoom-out';
import { unlock } from '../../lock-unlock';

export default function WelcomeGuide() {
	const { isActive, isZoomOut } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return {
			isActive: get( 'core', 'welcomeGuideZoomOut' ),
			isZoomOut: unlock( select( blockEditorStore ) ).isZoomOut(),
		};
	}, [] );

	if ( ! isActive || ! isZoomOut ) {
		return null;
	}

	return <WelcomeGuideZoomOut />;
}
