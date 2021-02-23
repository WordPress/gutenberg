import { CSSProperties } from 'react';
import { HStackAlignment, Props as HStackProps } from '../h-stack/types';

export type Props = HStackProps & {
	alignment?: HStackAlignment | CSSProperties[ 'alignItems' ];
	spacing?: CSSProperties[ 'width' ];
};
