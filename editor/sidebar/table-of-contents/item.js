/**
 * External dependencies
 */
import classnames from 'classnames';

const TableOfContentsItem = ( {
	children,
	isValid,
	level,
} ) => (
	<div
		className={ classnames(
			'table-of-contents-item',
			`is-h${ level }`,
			{
				'is-invalid': ! isValid,
			}
		) }
	>
		<strong className="table-of-contents-item__level">
			H{ level }
		</strong>
		<div className="table-of-contents-item__content">
			{ children }
		</div>
	</div>
);

export default TableOfContentsItem;
