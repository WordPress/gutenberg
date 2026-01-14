/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	SelectControl,
	FormTokenField,
	TextareaControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';

/**
 * Point of view options.
 */
const POV_OPTIONS = [
	{ value: '', label: __( 'Select...', 'content-guidelines' ) },
	{
		value: 'we_you',
		label: __( 'We → You ("We help you...")', 'content-guidelines' ),
	},
	{
		value: 'i_you',
		label: __( 'I → You ("I\'ll show you...")', 'content-guidelines' ),
	},
	{
		value: 'third_person',
		label: __( 'Third person ("The company...")', 'content-guidelines' ),
	},
];

/**
 * Readability options.
 */
const READABILITY_OPTIONS = [
	{
		value: 'simple',
		label: __( 'Simple (elementary level)', 'content-guidelines' ),
	},
	{
		value: 'general',
		label: __( 'General audience', 'content-guidelines' ),
	},
	{
		value: 'expert',
		label: __( 'Expert / technical', 'content-guidelines' ),
	},
];

/**
 * Common tone trait suggestions.
 */
const TONE_SUGGESTIONS = [
	'warm',
	'confident',
	'plain English',
	'friendly',
	'professional',
	'authoritative',
	'casual',
	'direct',
	'empathetic',
	'enthusiastic',
];

/**
 * Voice & Tone panel.
 *
 * @return {JSX.Element} Panel component.
 */
export default function VoiceTonePanel() {
	const voiceTone = useSelect(
		( select ) => select( STORE_NAME ).getVoiceTone() || {},
		[]
	);

	const { updateDraftSection } = useDispatch( STORE_NAME );

	const handleChange = ( field, value ) => {
		updateDraftSection( 'voice_tone', { [ field ]: value } );
	};

	return (
		<PanelBody
			title={ __( 'Voice & tone', 'content-guidelines' ) }
			initialOpen={ false }
		>
			<FormTokenField
				label={ __( 'Tone traits', 'content-guidelines' ) }
				value={ voiceTone.tone_traits || [] }
				suggestions={ TONE_SUGGESTIONS }
				onChange={ ( value ) => handleChange( 'tone_traits', value ) }
				__experimentalExpandOnFocus
				__experimentalShowHowTo={ false }
			/>

			<SelectControl
				label={ __( 'Point of view', 'content-guidelines' ) }
				help={ __(
					'How should AI refer to your site/company?',
					'content-guidelines'
				) }
				value={ voiceTone.pov || '' }
				options={ POV_OPTIONS }
				onChange={ ( value ) => handleChange( 'pov', value ) }
			/>

			<SelectControl
				label={ __( 'Readability', 'content-guidelines' ) }
				help={ __(
					'Target reading level for content.',
					'content-guidelines'
				) }
				value={ voiceTone.readability || 'general' }
				options={ READABILITY_OPTIONS }
				onChange={ ( value ) => handleChange( 'readability', value ) }
			/>

			<TextareaControl
				label={ __( 'Good example', 'content-guidelines' ) }
				help={ __(
					'A sentence that captures your ideal voice.',
					'content-guidelines'
				) }
				value={ voiceTone.example_good || '' }
				onChange={ ( value ) => handleChange( 'example_good', value ) }
				rows={ 2 }
			/>

			<TextareaControl
				label={ __( 'Example to avoid', 'content-guidelines' ) }
				help={ __(
					'A sentence showing what NOT to sound like.',
					'content-guidelines'
				) }
				value={ voiceTone.example_avoid || '' }
				onChange={ ( value ) => handleChange( 'example_avoid', value ) }
				rows={ 2 }
			/>
		</PanelBody>
	);
}
