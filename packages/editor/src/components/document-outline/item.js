/**
 * External dependencies
 */
import clsx from 'clsx';

const TableOfContentsItem = ( {
	children,
	isValid,
	level,
	href,
	onSelect,
} ) => (
	<li
		className={ clsx(
			'document-outline__item',
			`is-${ level.toLowerCase() }`,
			{
				'is-invalid': ! isValid,
			}
		) }
	>
		<a
			href={ href }
			className="document-outline__button"
			onClick={ onSelect }
		>
			<span
				className="document-outline__emdash"
				aria-hidden="true"
			></span>
			<strong className="document-outline__level">{ level }</strong>
			<span className="document-outline__item-content">{ children }</span>
		</a>
	</li>
);

export default TableOfContentsItem;
