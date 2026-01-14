/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	TextareaControl,
	TextControl,
	SelectControl,
	FormTokenField,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';

/**
 * Goal options.
 */
const GOAL_OPTIONS = [
	{ value: '', label: __( 'Select a goal...', 'content-guidelines' ) },
	{ value: 'subscribe', label: __( 'Get email subscribers', 'content-guidelines' ) },
	{ value: 'sell', label: __( 'Sell products/services', 'content-guidelines' ) },
	{ value: 'inform', label: __( 'Inform and educate', 'content-guidelines' ) },
	{ value: 'community', label: __( 'Build community', 'content-guidelines' ) },
	{ value: 'other', label: __( 'Other', 'content-guidelines' ) },
];

/**
 * Brand & Site Context panel.
 *
 * @return {JSX.Element} Panel component.
 */
export default function BrandContextPanel() {
	const brandContext = useSelect(
		( select ) => select( STORE_NAME ).getBrandContext() || {},
		[]
	);

	const { updateDraftSection } = useDispatch( STORE_NAME );

	const handleChange = ( field, value ) => {
		updateDraftSection( 'brand_context', { [ field ]: value } );
	};

	return (
		<PanelBody
			title={ __( 'Brand & site context', 'content-guidelines' ) }
			initialOpen={ true }
		>
			<TextareaControl
				label={ __( 'What is this site about?', 'content-guidelines' ) }
				help={ __(
					'A brief description of your site, business, or publication.',
					'content-guidelines'
				) }
				value={ brandContext.site_description || '' }
				onChange={ ( value ) => handleChange( 'site_description', value ) }
				rows={ 3 }
			/>

			<TextControl
				label={ __( 'Target audience', 'content-guidelines' ) }
				help={ __(
					'Who are you writing for?',
					'content-guidelines'
				) }
				value={ brandContext.audience || '' }
				onChange={ ( value ) => handleChange( 'audience', value ) }
			/>

			<SelectControl
				label={ __( 'Primary goal', 'content-guidelines' ) }
				help={ __(
					'What do you want visitors to do?',
					'content-guidelines'
				) }
				value={ brandContext.primary_goal || '' }
				options={ GOAL_OPTIONS }
				onChange={ ( value ) => handleChange( 'primary_goal', value ) }
			/>

			<FormTokenField
				label={ __( 'Topics / coverage areas', 'content-guidelines' ) }
				value={ brandContext.topics || [] }
				onChange={ ( value ) => handleChange( 'topics', value ) }
				__experimentalExpandOnFocus
				__experimentalShowHowTo={ false }
			/>
		</PanelBody>
	);
}
