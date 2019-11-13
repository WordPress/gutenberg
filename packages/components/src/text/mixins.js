/**
 * External dependencies
 */
import css from '@emotion/css';
/**
 * Internal dependencies
 */
import { fontFamily } from './fontFamily';

const fontWeightNormal = `font-weight: normal;`;
const fontWeightSemibold = `font-weight: 600;`;

const title = `
  ${ fontWeightNormal }
  letter-spacing: 0;
`;

const titleLarge = `
	font-size: 32px;
	line-height: 40px;
`;

const titleMedium = `
	font-size: 24px;
	line-height: 32px;
`;

const titleSmall = `
	font-size: 20px;
	line-height: 28px;
`;

const subtitle = `
	${ fontWeightSemibold }
	letter-spacing: 0;
`;

const subtitleLarge = `
	font-size: 16px;
	line-height: 24px;
`;

const subtitleSmall = `
	font-size: 14px;
	line-height: 20px;
`;

const body = `
	${ fontWeightNormal }
	letter-spacing: 0;
`;

const bodySmall = `
	font-size: 14px;
	line-height: 20px;
`;

const bodyLarge = `
	font-size: 16px;
	line-height: 24px;
`;

const button = `
  ${ fontWeightSemibold }
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0;
`;

const caption = `
	${ fontWeightNormal }
	font-size: 12px;
	line-height: 16px;
	letter-spacing: 0;
`;

const label = `
	${ fontWeightSemibold }
	font-size: 12px;
	line-height: 16px;
	letter-spacing: 1;
	text-transform: uppercase;
`;

/**
 * @typedef {"title.large" | "title.medium" | "title.small" | "subtitle" | "subtitle.small" | "body" | "body.small" | "button" | "caption" | "label"} TextVariant
 */

/**
	* @param {TextVariant} variant
	*/
// eslint-disable-next-line no-shadow
const variant = ( variant ) => {
	switch ( variant ) {
		case 'title.large':
			return css`
				${ title }
				${ titleLarge }
			`;
		case 'title.medium':
			return css`
					${ title }
					${ titleMedium }
				`;
		case 'title.small':
			return css`
				${ title }
				${ titleSmall }
			`;

		case 'subtitle':
			return css`
				${ subtitle }
				${ subtitleLarge }
			`;
		case 'subtitle.small':
			return css`
				${ subtitle }
				${ subtitleSmall }
			`;

		case 'body':
			return css`
				${ body }
				${ bodyLarge }
			`;
		case 'body.small':
			return css`
				${ body }
				${ bodySmall }
			`;

		case 'button':
			return button;

		case 'caption':
			return caption;

		case 'label':
			return label;
	}
};

/**
 * @typedef {Object} TextProps
 * @property {TextVariant} variant
 */

/**
 * @param {TextProps} props
 */
export const text = ( props ) => css`
	${ fontFamily }
	${ variant( props.variant ) }
`;
