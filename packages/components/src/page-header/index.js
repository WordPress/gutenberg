/**
 * External dependencies
 */
import classnames from 'classnames';

function PageHeader( props ) {
	const { className, title, subtitle, ...restProps } = props;
	const classNames = classnames( className, 'components-page-header' );

	return (
		<div { ...restProps } className={ classNames }>
			<div className="components-page-header__title-wrapper">
				<h1 className="components-page-header__title">{ title }</h1>
			</div>
			{ subtitle && (
				<div className="components-page-header__subtitle">
					{ subtitle }
				</div>
			) }
		</div>
	);
}

export default PageHeader;
