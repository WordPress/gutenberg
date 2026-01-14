/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';

/**
 * Default empty guidelines structure.
 */
const DEFAULT_GUIDELINES = {
	version: 1,
	brand_context: {
		site_description: '',
		audience: '',
		primary_goal: '',
		topics: [],
	},
	voice_tone: {
		tone_traits: [],
		pov: '',
		readability: 'general',
		example_good: '',
		example_avoid: '',
	},
	copy_rules: {
		dos: [],
		donts: [],
		formatting: [],
	},
	vocabulary: {
		prefer: [],
		avoid: [],
	},
	image_style: {
		dos: [],
		donts: [],
		text_policy: '',
	},
	notes: '',
};

/**
 * Empty state component shown when no guidelines exist.
 *
 * @return {JSX.Element} Empty state component.
 */
export default function EmptyState() {
	const { setDraft } = useDispatch( STORE_NAME );

	const handleStartWriting = () => {
		setDraft( { ...DEFAULT_GUIDELINES } );
	};

	return (
		<div className="content-guidelines-empty-state">
			<div className="content-guidelines-empty-state__icon">
				<span role="img" aria-label="pencil">
					📝
				</span>
			</div>

			<h2 className="content-guidelines-empty-state__title">
				{ __( 'Set Content Guidelines', 'content-guidelines' ) }
			</h2>

			<p className="content-guidelines-empty-state__description">
				{ __(
					'Guidelines keep AI outputs consistent with your site\'s voice and brand. Define your tone, rules, and vocabulary once, and AI features will use them automatically.',
					'content-guidelines'
				) }
			</p>

			<div className="content-guidelines-empty-state__actions">
				<Button
					variant="primary"
					icon={ pencil }
					onClick={ handleStartWriting }
				>
					{ __( 'Start writing', 'content-guidelines' ) }
				</Button>
			</div>

			<p className="content-guidelines-empty-state__note">
				{ __(
					'AI-powered generation requires an AI provider plugin.',
					'content-guidelines'
				) }
			</p>
		</div>
	);
}
