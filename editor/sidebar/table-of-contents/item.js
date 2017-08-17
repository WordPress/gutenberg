/**
 * External dependencies
 */
import classnames from 'classnames';

const TableOfContentsItem = ( {
	children,
	isValid,
	level,
	onClick,
} ) => (
	<li
		className={ classnames(
			'table-of-contents-item',
			`is-h${ level }`,
			{
				'is-invalid': ! isValid,
			}
		) }
		onClick={ onClick }
	>
		<span className="table-of-contents-item__emdash" aria-hidden="true"></span>
		<strong className="table-of-contents-item__level">
			H{ level }
		</strong>
		<span className="table-of-contents-item__content">
			{ children }
		</span>
	</li>
);

export default TableOfContentsItem;
