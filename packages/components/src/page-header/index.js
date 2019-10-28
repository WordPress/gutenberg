/**
 * External dependencies
 */
import classnames from 'classnames';

function PageHeader( props ) {
	const {
		children,
		className,
		leftActions,
		rightActions,
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
			<div className="components-page-header__body">
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
				{ children && (
					<div className="components-page-header__content">
						{ children }
					</div>
				) }
			</div>
			{ rightActions && (
				<>
					<div className="components-page-header__right-actions">
						{ rightActions }
					</div>
				</>
			) }
		</div>
	);
}

export default PageHeader;
