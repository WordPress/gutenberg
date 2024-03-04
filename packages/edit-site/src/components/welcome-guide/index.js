/**
 * Internal dependencies
 */
import WelcomeGuideEditor from './editor';
import WelcomeGuideStyles from './styles';
import WelcomeGuidePage from './page';
import WelcomeGuideTemplate from './template';

export default function WelcomeGuide() {
	return (
		<>
			<WelcomeGuideEditor />
			<WelcomeGuideStyles />
			<WelcomeGuidePage />
			<WelcomeGuideTemplate />
		</>
	);
}
