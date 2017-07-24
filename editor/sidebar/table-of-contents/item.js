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
			'table-of-contents__item',
			`is-h${ level }`,
			{
				'is-invalid': ! isValid,
			}
		) }
	>
		<strong>H{ level }</strong>
		{ children }
	</div>
);

export default TableOfContentsItem;
