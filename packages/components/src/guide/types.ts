/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { ModalProps } from '../modal/types';

export type Page = {
	content: ReactNode;
	image?: ReactNode;
};

export type GuideProps = {
	children?: ReactNode;
	className?: string;
	contentLabel?: ModalProps[ 'contentLabel' ];
	finishButtonText?: string;
	onFinish?: () => void;
	pages?: Page[];
};

export type PageControlProps = {
	currentPage: number;
	numberOfPages: number;
	setCurrentPage: ( page: number ) => void;
};
