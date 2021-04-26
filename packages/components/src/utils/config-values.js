/**
 * Internal dependencies
 */
import { space } from './space';

const CONTROL_HEIGHT = '30px';
const CARD_PADDING_X = space( 3 );
const CARD_PADDING_Y = space( 3 );

export default {
	colorDivider: 'rgba(0, 0, 0, 0.1)',
	radiusBlockUi: '2px',
	borderWidth: '1px',
	borderWidthFocus: '1.5px',
	borderWidthTab: '4px',
	spinnerSize: '18px',
	fontSize: '13px',
	fontSizeH1: 'calc(2.44 * 13px)',
	fontSizeH2: 'calc(1.95 * 13px)',
	fontSizeH3: 'calc(1.56 * 13px)',
	fontSizeH4: 'calc(1.25 * 13px)',
	fontSizeH5: '13px',
	fontSizeH6: 'calc(0.8 * 13px)',
	fontSizeInputMobile: '16px',
	fontSizeMobile: '15px',
	fontSizeSmall: 'calc(0.92 * 13px)',
	fontSizeXSmall: 'calc(0.75 * 13px)',
	fontLineHeightBase: '1.2',
	fontWeight: 'normal',
	fontWeightHeading: '600',
	gridBase: '4px',
	controlHeight: CONTROL_HEIGHT,
	controlHeightLarge: `calc( ${ CONTROL_HEIGHT } * 1.2 )`,
	controlHeightSmall: `calc( ${ CONTROL_HEIGHT } * 0.8 )`,
	controlHeightXSmall: `calc( ${ CONTROL_HEIGHT } * 0.6 )`,
	cardBorderRadius: '2px',
	cardPaddingX: CARD_PADDING_X,
	cardPaddingY: CARD_PADDING_Y,
	cardPadding: `${ CARD_PADDING_X }, ${ CARD_PADDING_Y }`,
	cardHeaderFooterPaddingY: space( 1 ),
	cardHeaderHeight: '44px',
	surfaceBorderColor: 'rgba(0, 0, 0, 0.1)',
};
