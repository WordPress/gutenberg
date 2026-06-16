/**
 * WordPress dependencies
 */
import { Icon, layout } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export function isTemplateLikeItem( item: {
	type?: string;
	_isTemplatePage?: boolean;
} ) {
	return item._isTemplatePage || item.type === 'wp_template';
}

export function TemplateItemTitle( {
	badgeLabel = __( 'Template' ),
	children,
}: {
	badgeLabel?: ReactNode;
	children: ReactNode;
} ) {
	return (
		<span className="routes-post-list__template-title">
			<span
				className="routes-post-list__template-title-icon"
				aria-hidden="true"
			>
				<Icon icon={ layout } size={ 16 } />
			</span>
			<span className="routes-post-list__template-title-content">
				{ children }
			</span>
			<TemplateItemBadge>{ badgeLabel }</TemplateItemBadge>
		</span>
	);
}

export function TemplateItemBadge( { children }: { children: ReactNode } ) {
	return (
		<span className="routes-post-list__template-badge">{ children }</span>
	);
}

export function TemplateItemPreview( { children }: { children: ReactNode } ) {
	return (
		<span className="routes-post-list__template-preview">
			<span className="routes-post-list__template-preview-content">
				{ children }
			</span>
			<span className="routes-post-list__template-preview-badge">
				{ __( 'Template' ) }
			</span>
		</span>
	);
}
