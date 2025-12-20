/**
 * Internal dependencies
 */
import WelcomeGuideEditor from './editor';
import WelcomeGuidePage from './page';
import WelcomeGuideTemplate from './template';

export default function WelcomeGuide( { postType } ) {
	return (
		<>
			<WelcomeGuideEditor />
			{ postType === 'page' && <WelcomeGuidePage /> }
			{ postType === 'wp_template' && <WelcomeGuideTemplate /> }
		</>
	);
}
