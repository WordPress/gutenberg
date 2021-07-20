/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { Props as ControlLabelProps } from '../control-label/types';
import type { Props as GridProps } from '../../grid/types';

export type FormGroupLabelProps = ControlLabelProps & {
	labelHidden?: boolean;
	id?: string;
};

export type FormGroupContentProps = FormGroupLabelProps & {
	alignLabel?: CSSProperties[ 'textAlign' ];
	help?: ReactNode;
	horizontal?: boolean;
	label?: ReactNode;
	spacing?: CSSProperties[ 'width' ];
	truncate?: boolean;
};

type Horizontal = GridProps & {
	horizontal: true;
};

type Vertical = { horizontal: false };

export type FormGroupProps = FormGroupContentProps & ( Horizontal | Vertical );
