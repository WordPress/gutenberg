/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';

/**
 * Internal dependencies
 */
import WelcomeGuideEditor from './editor';
import WelcomeGuideStyles from './styles';

function WelcomeGuide() {
	return (
		<>
			<WelcomeGuideEditor />
			<WelcomeGuideStyles />
		</>
	);
}

export default withFilters( 'editSite.WelcomeGuide' )( WelcomeGuide );
