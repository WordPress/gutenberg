/**
 * Plugin-local shim for @wordpress/admin-ui Page component.
 *
 * @wordpress/admin-ui is an internal Gutenberg package (no wpScript handle)
 * that uses private APIs, so it can't be used from plugins. This component
 * replicates the exact HTML structure and CSS classes so the same styles apply.
 */

import './page.scss';

export function Page( {
	title,
	subTitle,
	children,
	className,
	actions,
}: {
	title?: React.ReactNode;
	subTitle?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	actions?: React.ReactNode;
} ) {
	const classes = [ 'admin-ui-page', className ].filter( Boolean ).join( ' ' );

	return (
		<div className={ classes } role="region" aria-label={ typeof title === 'string' ? title : '' }>
			{ title && (
				<header className="admin-ui-page__header">
					<div style={ { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } }>
						<div style={ { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' } }>
							{ title && (
								<h2 className="admin-ui-page__header-title">
									{ title }
								</h2>
							) }
						</div>
						{ actions && (
							<div
								className="admin-ui-page__header-actions"
								style={ { width: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' } }
							>
								{ actions }
							</div>
						) }
					</div>
					{ subTitle && (
						<p className="admin-ui-page__header-subtitle">
							{ subTitle }
						</p>
					) }
				</header>
			) }
			{ children }
		</div>
	);
}
