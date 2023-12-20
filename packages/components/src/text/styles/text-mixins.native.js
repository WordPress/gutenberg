/**
 * Internal dependencies
 */
import { fontFamily } from './font-family';
import css from './emotion-css';
import { COLORS } from '../../utils/colors-values';

const fontWeightNormal = `font-weight: 400;`;
const fontWeightMedium = `font-weight: 500;`;
const fontWeightSemibold = `font-weight: 600;`;

const title = `
  ${ fontWeightNormal }
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
	font-size: 14px;
	line-height: 20px;
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
`;

const bodyLarge = `
	font-size: 16px;
	line-height: 24px;
`;

const bodySmall = `
	font-size: 14px;
	line-height: 20px;
`;

const button = `
  ${ fontWeightSemibold }
  font-size: 14px;
  line-height: 20px;
`;

const caption = `
	${ fontWeightNormal }
	font-size: 12px;
	line-height: 16px;
`;

const label = `
	${ fontWeightSemibold }
	font-size: 12px;
	line-height: 16px;
`;

const sectionHeading = `
	${ fontWeightMedium }
	font-size: 11px;
	line-height: 1.4;
	text-transform: uppercase;
	color: ${ COLORS.gray[ 700 ] }
`;

/**
 * @typedef {'title.large'|'title.medium'|'title.small'|'subtitle'|'subtitle.small'|'body'|'body.large'|'body.small'|'button'|'caption'|'label'|'sectionheading'} TextVariant
 */

/**
 * @param {TextVariant} variantName
 */
const variant = ( variantName = 'body' ) => {
	switch ( variantName ) {
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
			`;
		case 'body.large':
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

		case 'sectionheading':
			return sectionHeading;
	}
};

/**
 * @typedef {Object} TextProps
 * @property {TextVariant} variant one of TextVariant to be used
 */

/**
 * @param {TextProps} props
 */
export const text = ( props ) => css`
	${ fontFamily }
	${ variant( props.variant ) }
`;
