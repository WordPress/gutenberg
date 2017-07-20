/**
 * External dependencies
 */
import classnames from 'classnames';

const TableOfContentsItem = ( { valid, level, children } ) => (
	<div
		className={ classnames(
			'table-of-contents__item',
			`is-H${ level }`,
			{
				'is-invalid': ! valid,
			}
		) }
	>
		<strong>H{ level }</strong>
		{ children }
	</div>
);

export default TableOfContentsItem;
