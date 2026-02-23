/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import {
	registerConnector,
	ConnectorItem,
	DefaultConnectorSettings,
	type ConnectorRenderProps,
} from '@wordpress/connectors';
import { useState } from '@wordpress/element';
import { chevronUp, chevronDown } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

// OpenAI logo as inline SVG
const OpenAILogo = () => (
	<svg
		width="40"
		height="40"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1685a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4043-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
			fill="currentColor"
		/>
	</svg>
);

// Claude/Anthropic logo as inline SVG
const ClaudeLogo = () => (
	<svg
		width="32"
		height="32"
		viewBox="0 0 32 32"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M6.2 21.024L12.416 17.536L12.52 17.232L12.416 17.064H12.112L11.072 17L7.52 16.904L4.44 16.776L1.456 16.616L0.704 16.456L0 15.528L0.072 15.064L0.704 14.64L1.608 14.72L3.608 14.856L6.608 15.064L8.784 15.192L12.008 15.528H12.52L12.592 15.32L12.416 15.192L12.28 15.064L9.176 12.96L5.816 10.736L4.056 9.456L3.104 8.808L2.624 8.2L2.416 6.872L3.28 5.92L4.44 6L4.736 6.08L5.912 6.984L8.424 8.928L11.704 11.344L12.184 11.744L12.376 11.608L12.4 11.512L12.184 11.152L10.4 7.928L8.496 4.648L7.648 3.288L7.424 2.472C7.344 2.136 7.288 1.856 7.288 1.512L8.272 0.176L8.816 0L10.128 0.176L10.68 0.656L11.496 2.52L12.816 5.456L14.864 9.448L15.464 10.632L15.784 11.728L15.904 12.064H16.112V11.872L16.28 9.624L16.592 6.864L16.896 3.312L17 2.312L17.496 1.112L18.48 0.464L19.248 0.832L19.88 1.736L19.792 2.32L19.416 4.76L18.68 8.584L18.2 11.144H18.48L18.8 10.824L20.096 9.104L22.272 6.384L23.232 5.304L24.352 4.112L25.072 3.544H26.432L27.432 5.032L26.984 6.568L25.584 8.344L24.424 9.848L22.76 12.088L21.72 13.88L21.816 14.024L22.064 14L25.824 13.2L27.856 12.832L30.28 12.416L31.376 12.928L31.496 13.448L31.064 14.512L28.472 15.152L25.432 15.76L20.904 16.832L20.848 16.872L20.912 16.952L22.952 17.144L23.824 17.192H25.96L29.936 17.488L30.976 18.176L31.6 19.016L31.496 19.656L29.896 20.472L27.736 19.96L22.696 18.76L20.968 18.328H20.728V18.472L22.168 19.88L24.808 22.264L28.112 25.336L28.28 26.096L27.856 26.696L27.408 26.632L24.504 24.448L23.384 23.464L20.848 21.328H20.68V21.552L21.264 22.408L24.352 27.048L24.512 28.472L24.288 28.936L23.488 29.216L22.608 29.056L20.8 26.52L18.936 23.664L17.432 21.104L17.248 21.208L16.36 30.768L15.944 31.256L14.984 31.624L14.184 31.016L13.76 30.032L14.184 28.088L14.696 25.552L15.112 23.536L15.488 21.032L15.712 20.2L15.696 20.144L15.512 20.168L13.624 22.76L10.752 26.64L8.48 29.072L7.936 29.288L6.992 28.8L7.08 27.928L7.608 27.152L10.752 23.152L12.648 20.672L13.872 19.24L13.864 19.032H13.792L5.44 24.456L3.952 24.648L3.312 24.048L3.392 23.064L3.696 22.744L6.208 21.016L6.2 21.024Z"
			fill="#D97757"
		/>
	</svg>
);

// Gemini logo as inline SVG
const GeminiLogo = () => (
	<svg
		width="32"
		height="32"
		viewBox="0 0 32 32"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
	>
		<rect width="32" height="32" fill="url(#pattern0_12_431)" />
		<defs>
			<pattern
				id="pattern0_12_431"
				patternContentUnits="objectBoundingBox"
				width="1"
				height="1"
			>
				<use xlinkHref="#image0_12_431" transform="scale(0.0104167)" />
			</pattern>
			<image
				id="image0_12_431"
				width="96"
				height="96"
				preserveAspectRatio="none"
				xlinkHref="data:image/png;base64,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"
			/>
		</defs>
	</svg>
);

// OpenAI connector render component
function OpenAIConnector( { label, description }: ConnectorRenderProps ) {
	const [ isExpanded, setIsExpanded ] = useState( false );

	return (
		<ConnectorItem
			icon={ <OpenAILogo /> }
			name={ label }
			description={ description }
			actionArea={
				<Button
					variant="secondary"
					size="compact"
					icon={ isExpanded ? chevronUp : chevronDown }
					iconPosition="right"
					onClick={ () => setIsExpanded( ! isExpanded ) }
					aria-expanded={ isExpanded }
				>
					{ isExpanded ? __( 'Close' ) : __( 'Install' ) }
				</Button>
			}
		>
			{ isExpanded && (
				<DefaultConnectorSettings
					onSave={ ( apiKey: string ) => {
						// eslint-disable-next-line no-console
						console.log( 'Saving OpenAI API key:', apiKey );
					} }
					onCancel={ () => setIsExpanded( false ) }
				/>
			) }
		</ConnectorItem>
	);
}

// Claude connector render component
function ClaudeConnector( { label, description }: ConnectorRenderProps ) {
	const [ isExpanded, setIsExpanded ] = useState( false );

	return (
		<ConnectorItem
			icon={ <ClaudeLogo /> }
			name={ label }
			description={ description }
			actionArea={
				<Button
					variant="secondary"
					size="compact"
					icon={ isExpanded ? chevronUp : chevronDown }
					iconPosition="right"
					onClick={ () => setIsExpanded( ! isExpanded ) }
					aria-expanded={ isExpanded }
				>
					{ isExpanded ? __( 'Close' ) : __( 'Install' ) }
				</Button>
			}
		>
			{ isExpanded && (
				<DefaultConnectorSettings
					onSave={ ( apiKey: string ) => {
						// eslint-disable-next-line no-console
						console.log( 'Saving Claude API key:', apiKey );
					} }
					onCancel={ () => setIsExpanded( false ) }
				/>
			) }
		</ConnectorItem>
	);
}

// Gemini connector render component
function GeminiConnector( { label, description }: ConnectorRenderProps ) {
	const [ isExpanded, setIsExpanded ] = useState( false );

	return (
		<ConnectorItem
			icon={ <GeminiLogo /> }
			name={ label }
			description={ description }
			actionArea={
				<Button
					variant="secondary"
					size="compact"
					icon={ isExpanded ? chevronUp : chevronDown }
					iconPosition="right"
					onClick={ () => setIsExpanded( ! isExpanded ) }
					aria-expanded={ isExpanded }
				>
					{ isExpanded ? __( 'Close' ) : __( 'Install' ) }
				</Button>
			}
		>
			{ isExpanded && (
				<DefaultConnectorSettings
					onSave={ ( apiKey: string ) => {
						// eslint-disable-next-line no-console
						console.log( 'Saving Gemini API key:', apiKey );
					} }
					onCancel={ () => setIsExpanded( false ) }
				/>
			) }
		</ConnectorItem>
	);
}

// Register built-in connectors
export function registerDefaultConnectors() {
	registerConnector( 'core/openai', {
		label: __( 'OpenAI' ),
		description: __(
			'Text, image, and code generation with GPT and DALL-E.'
		),
		render: OpenAIConnector,
	} );

	registerConnector( 'core/claude', {
		label: __( 'Claude' ),
		description: __( 'Writing, research, and analysis with Claude.' ),
		render: ClaudeConnector,
	} );

	registerConnector( 'core/gemini', {
		label: __( 'Gemini' ),
		description: __(
			"Content generation, translation, and vision with Google's Gemini."
		),
		render: GeminiConnector,
	} );
}
