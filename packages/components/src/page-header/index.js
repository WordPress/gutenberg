/**
 * External dependencies
 */
import classnames from 'classnames';

function PageHeader( props ) {
	const {
		children,
		className,
		leftActions,
		title,
		subtitle,
		...restProps
	} = props;
	const classNames = classnames( className, 'components-page-header' );

	return (
		<div { ...restProps } className={ classNames }>
			{ leftActions && (
				<div className="components-page-header__left-actions">
					{ leftActions }
				</div>
			) }
			<div className="components-page-header__content">
				{ title && (
					<div className="components-page-header__title-wrapper">
						<h1 className="components-page-header__title">
							{ title }
						</h1>
					</div>
				) }
				{ subtitle && (
					<div className="components-page-header__subtitle">
						{ subtitle }
					</div>
				) }
			</div>
			{ children }
		</div>
	);
}

export default PageHeader;
