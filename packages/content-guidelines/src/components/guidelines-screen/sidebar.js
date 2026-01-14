/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BrandContextPanel from '../panels/brand-context';
import VoiceTonePanel from '../panels/voice-tone';
import CopyRulesPanel from '../panels/copy-rules';
import VocabularyPanel from '../panels/vocabulary';
import ImagesPanel from '../panels/images';
import NotesPanel from '../panels/notes';
import Playground from '../playground';
import EmptyState from './empty-state';

/**
 * Sidebar component with tabs.
 *
 * @param {Object}  props              Component props.
 * @param {number}  props.fixturePostId Selected fixture post ID.
 * @param {boolean} props.hasGuidelines Whether guidelines exist.
 * @return {JSX.Element} Sidebar component.
 */
export default function Sidebar( { fixturePostId, hasGuidelines } ) {
	const tabs = [
		{
			name: 'guidelines',
			title: __( 'Guidelines', 'content-guidelines' ),
		},
		{
			name: 'playground',
			title: __( 'Playground', 'content-guidelines' ),
		},
	];

	return (
		<div className="content-guidelines-sidebar">
			<TabPanel tabs={ tabs }>
				{ ( tab ) => {
					if ( tab.name === 'guidelines' ) {
						if ( ! hasGuidelines ) {
							return <EmptyState />;
						}

						return (
							<div className="content-guidelines-sidebar__panels">
								<BrandContextPanel />
								<VoiceTonePanel />
								<CopyRulesPanel />
								<VocabularyPanel />
								<ImagesPanel />
								<NotesPanel />
							</div>
						);
					}

					if ( tab.name === 'playground' ) {
						return <Playground fixturePostId={ fixturePostId } />;
					}

					return null;
				} }
			</TabPanel>
		</div>
	);
}
