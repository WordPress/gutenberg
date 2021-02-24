/**
 * Internal dependencies
 */
import { Props as TextProps } from '../text/types';

export type Props = TextProps & {
	isBlock?: boolean;
	size?: 'large' | 'medium' | 'small';
};
