/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { ActionBar, ActionBarBlock, ActionBarItem } from '../action-bar';

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
		<ActionBar { ...restProps } className={ classNames }>
			{ leftActions && (
				<ActionBarItem className="components-page-header__left-actions">
					{ leftActions }
				</ActionBarItem>
			) }
			<ActionBarBlock className="components-page-header__body">
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
			</ActionBarBlock>
			{ rightActions && (
				<ActionBarItem className="components-page-header__right-actions">
					{ rightActions }
				</ActionBarItem>
			) }
		</ActionBar>
	);
}

PageHeader.defaultProps = {
	align: 'top',
};

export default PageHeader;
