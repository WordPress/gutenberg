import type { ComponentProps } from 'react';
import type { Modal } from '@wordpress/components';
import type { Block as PatternRecord, Term } from '@wordpress/core-data';
import type { PatternCategoryMap } from '../types';

/**
 * The modal props a modal component passes on to its `Modal`.
 */
type PassedModalProps = Partial<
	Omit< ComponentProps< typeof Modal >, 'children' >
>;

export interface AllowOverridesModalProps {
	placeholder?: string;
	initialName?: string;
	onClose: () => void;
	onSave: ( name: string ) => void;
}

export interface DisallowOverridesModalProps {
	onClose: () => void;
	onSave: () => void;
}

export interface CategorySelectorProps {
	categoryTerms: Array< string >;
	onChange: ( terms: Array< string > ) => void;
	categoryMap: PatternCategoryMap;
}

/**
 * The outcome of creating a pattern.
 */
export interface CreatePatternResult {
	pattern: PatternRecord< 'edit' >;
	categoryId: string;
}

export interface CreatePatternModalContentsProps {
	confirmLabel?: string;
	defaultCategories?: Array< string >;
	/**
	 * The serialized blocks of the pattern, or a function returning them.
	 */
	content?: string | ( () => string );
	onClose: () => void;
	onError?: () => void;
	onSuccess: ( result: CreatePatternResult ) => void;
	defaultSyncType?: string;
	defaultTitle?: string;
}

export interface CreatePatternModalProps extends CreatePatternModalContentsProps {
	className?: string;
	modalTitle?: string;
}

/**
 * A theme or user pattern to duplicate.
 */
export interface DuplicatedPattern {
	type: string;
	content?: CreatePatternModalContentsProps[ 'content' ];
	title: string | { raw: string };
	/**
	 * The core category names of a theme pattern.
	 */
	categories?: Array< string >;
	/**
	 * The category term IDs of a user pattern.
	 */
	wp_pattern_category?: Array< number >;
	wp_pattern_sync_status?: string;
}

/**
 * The core and user pattern categories.
 */
export interface PatternCategories {
	core?: Array< { name: string; label: string } >;
	user?: Array< { id: number; label: string } >;
}

export interface DuplicatePatternPropsOptions {
	pattern?: DuplicatedPattern | null;
	onSuccess?: ( result: Pick< CreatePatternResult, 'pattern' > ) => void;
}

/**
 * The props of `CreatePatternModal` that duplicate a pattern.
 */
export type DuplicatePatternProps = Pick<
	CreatePatternModalContentsProps,
	| 'content'
	| 'defaultCategories'
	| 'defaultSyncType'
	| 'defaultTitle'
	| 'onSuccess'
>;

export interface DuplicatePatternModalProps extends DuplicatePatternPropsOptions {
	onClose: () => void;
}

export interface RenamePatternModalProps extends PassedModalProps {
	onClose: () => void;
	onError?: () => void;
	onSuccess?: ( savedRecord: PatternRecord< 'edit' > ) => void;
	pattern: {
		id: number;
		type: string;
		title: string;
	};
}

export interface RenamePatternCategoryModalProps extends PassedModalProps {
	category: {
		id: number;
		slug: string;
		name: string;
	};
	existingCategories: {
		patternCategories: Array< { id?: number; label: string } >;
	};
	onClose: () => void;
	onError?: () => void;
	onSuccess?: ( savedRecord: Term< 'edit' > ) => void;
}
