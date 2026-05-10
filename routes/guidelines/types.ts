/**
 * Types for the Guidelines feature.
 */

import type { ReactNode } from 'react';

export interface Categories {
	site: string;
	copy: string;
	images: string;
	additional: string;
	blocks: Record< string, string >;
}

export interface GuidelinesState {
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

export interface GuidelinesImportData {
	guideline_categories: {
		site?: { guidelines?: string };
		copy?: { guidelines?: string };
		images?: { guidelines?: string };
		additional?: { guidelines?: string };
		blocks?: Record< string, { guidelines?: string } >;
	};
}

export interface GuidelineAccordionProps {
	title: string;
	description: string;
	children: ReactNode;
}

export interface GuidelinesRevision {
	id: number;
	date: string;
	author: number;
	_embedded?: {
		author: Array< { name: string } >;
	};
}
