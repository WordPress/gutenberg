/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useGuidelines } from '../../hooks';

/**
 * Default empty guidelines structure.
 */
const DEFAULT_GUIDELINES = {
	brand_context: {
		site_description: '',
		audience: '',
		primary_goal: '',
		topics: [],
	},
	voice_tone: {
		description: '',
		tone_traits: [],
		tone_notes: '',
		pov: '',
		readability: '',
	},
	copy_rules: {
		dos: [],
		donts: [],
	},
	vocabulary: {
		prefer: [],
		avoid: [],
		acronyms: [],
		acronym_usage: 'expand_first',
		custom_dictionary: [],
		voice_corrections: [],
	},
	heuristics: {
		words_per_sentence: '',
		sentences_per_paragraph: '',
		paragraphs_per_section: '',
		reading_level: '',
		reading_level_custom: '',
		max_syllables: '',
	},
	references: {
		references: [],
		notes: '',
	},
	images: {
		style: '',
		alt_text_guidelines: '',
		reference_images: [],
		dos: [],
		donts: [],
		text_policy: '',
	},
	notes: '',
	blocks: {},
};

/**
 * Empty state component shown when no guidelines exist.
 *
 * @return {JSX.Element} Empty state component.
 */
export default function EmptyState() {
	const { edit } = useGuidelines();

	const handleStartWriting = () => {
		edit( DEFAULT_GUIDELINES );
	};

	return (
		<div className="content-guidelines-empty-state">
			<div className="content-guidelines-empty-state__icon">
				<span role="img" aria-label="pencil">
					📝
				</span>
			</div>

			<h2 className="content-guidelines-empty-state__title">
				{ __( 'Set Content Guidelines' ) }
			</h2>

			<p className="content-guidelines-empty-state__description">
				{ __(
					"Guidelines keep AI outputs consistent with your site's voice and brand. Define your tone, rules, and vocabulary once, and AI features will use them automatically."
				) }
			</p>

			<div className="content-guidelines-empty-state__actions">
				<Button
					variant="primary"
					icon={ pencil }
					onClick={ handleStartWriting }
				>
					{ __( 'Start writing' ) }
				</Button>
			</div>

			<p className="content-guidelines-empty-state__note">
				{ __(
					'AI-powered generation requires an AI provider plugin.'
				) }
			</p>
		</div>
	);
}
