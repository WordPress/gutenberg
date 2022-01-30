/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type Merge = {
	defaultProps: [  ];
	props: [  ];
	className: string;
};

export type DropdownMenuProps = {
	children?: ReactNode;
	className?: string;
	controls?: [  ];
	icon: JSX.Element;
	label: string;
	popoverProps?: JSX.Element;
	toggleProps: { isSmall: boolean };
	menuProps: { className: string };
	disableOpenOnArrowDown?: boolean;
	text?: string;
	noIcons?: string;
};
