/**
 * Types for the Content Guidelines feature.
 */

import type { ReactNode } from 'react';

export interface Categories {
	site: string;
	copy: string;
	images: string;
	additional: string;
	blocks: Record< string, string >;
}

export interface ContentGuidelinesState {
	id: number | null;
	status: string | null;
	categories: Categories;
}

interface BlockGuideline {
	guidelines: string | Record< string, string >;
}

export interface RestGuidelinesResponse {
	id: number;
	status: string;
	guideline_categories?: Record< string, BlockGuideline >;
}

export interface GuidelineAccordionProps {
	title: string;
	description: string;
	children: ReactNode;
	contentId?: string;
	headingId?: string;
	descriptionId?: string;
}

export interface GuidelineAccordionFormProps {
	slug: string;
	contentId?: string; // Used for a11y.
	headingId?: string; // Used for a11y.
	descriptionId?: string;
}
