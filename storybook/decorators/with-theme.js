/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import Theme from '../../packages/components/src/theme';

const themes = {
	default: {},
	darkBg: {
		accent: '#f7c849',
		background: '#1e1e1e',
	},
	lightGrayBg: {
		accent: '#3858e9',
		background: '#f0f0f0',
	},
	modern: {
		accent: '#3858e9',
	},
};

const backgroundStyles = ( { background } ) => {
	if ( background ) {
		return css`
			background: ${ background };
			padding: 20px 20px 8px;
			outline: 1px dashed #ccc;
			outline-offset: 2px;
		`;
	}
};

const BackgroundColorWrapper = styled.div`
	${ backgroundStyles }
`;

const BackgroundIndicator = styled.small`
	display: block;
	opacity: 0.3;
	margin-top: 20px;
	font-size: 10px;
	color: var( --wp-components-color-foreground );
	text-transform: uppercase;
	text-align: end;
`;

const Notice = styled.small`
	display: block;
	margin-top: 20px;
	font-size: 12px;
	color: var( --wp-components-color-foreground );
`;

/**
 *  A Storybook decorator to show a div before and after the story to check for unwanted margins.
 */

export const WithTheme = ( Story, context ) => {
	const selectedTheme = themes[ context.globals.componentsTheme ];
	const selectedBackground = selectedTheme.background;

	if ( context.componentId === 'components-experimental-theme' ) {
		return (
			<>
				<Story />
				{ context.globals.componentsTheme !== 'default' && (
					<Notice>
						The Theme toolbar addon is disabled for this story. Use
						Controls to change the values.
					</Notice>
				) }
			</>
		);
	}

	return (
		<BackgroundColorWrapper background={ selectedBackground }>
			<Theme { ...themes[ context.globals.componentsTheme ] }>
				<Story { ...context } />
				{ selectedBackground && (
					<BackgroundIndicator>
						Themed background { selectedBackground }
					</BackgroundIndicator>
				) }
			</Theme>
		</BackgroundColorWrapper>
	);
};
