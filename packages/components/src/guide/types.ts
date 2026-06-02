/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { ModalProps } from '../modal/types';

export type Page = {
	/**
	 * Content of the page.
	 */
	content: ReactNode;
	/**
	 * Image displayed above the page content.
	 */
	image?: ReactNode;
};

export type GuideProps = {
	/**
	 * Deprecated. Use `pages` prop instead.
	 *
	 * @deprecated since 5.5
	 */
	children?: ReactNode;
	/**
	 * A custom class to add to the modal.
	 */
	className?: string;
	/**
	 * Used as the modal's accessibility label.
	 */
	contentLabel: ModalProps[ 'contentLabel' ];
	/**
	 * Use this to customize the label of the _Finish_ button shown at the end of the guide.
	 *
	 * @default 'Finish'
	 */
	finishButtonText?: string;
	/**
	 * Use this to customize the label of the _Next_ button shown on each page of the guide.
	 *
	 * @default 'Next'
	 */
	nextButtonText?: string;
	/**
	 * Use this to customize the label of the _Previous_ button shown on each page of the guide except the first.
	 *
	 * @default 'Previous'
	 */
	previousButtonText?: string;
	/**
	 * A function which is called when the guide is finished.
	 */
	onFinish: ModalProps[ 'onRequestClose' ];
	/**
	 * A list of objects describing each page in the guide. Each object **must** contain a `'content'` property and may optionally contain a `'image'` property.
	 *
	 * @default []
	 */
	pages?: Page[];
};

export type PageControlProps = {
	/**
	 * Current page index.
	 */
	currentPage: number;
	/**
	 * Total number of pages.
	 */
	numberOfPages: number;
	/**
	 * Called when user clicks on a `PageControlIcon` button.
	 */
	setCurrentPage: ( page: number ) => void;
};
