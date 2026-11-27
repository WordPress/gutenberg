import clsx from 'clsx';

const TableOfContentsItem = ( {
	children,
	isValid,
	isDisabled,
	level,
	onSelect,
} ) => {
	function handleClick() {
		if ( isDisabled ) {
			return;
		}
		onSelect();
	}

	return (
		<li
			className={ clsx(
				'document-outline__item',
				`is-${ level.toLowerCase() }`,
				{
					'is-invalid': ! isValid,
					'is-disabled': isDisabled,
				}
			) }
		>
			<button
				type="button"
				className="document-outline__button"
				aria-disabled={ isDisabled }
				onClick={ handleClick }
			>
				<span
					className="document-outline__emdash"
					aria-hidden="true"
				></span>
				<strong className="document-outline__level">{ level }</strong>
				<span className="document-outline__item-content">
					{ children }
				</span>
			</button>
		</li>
	);
};

export default TableOfContentsItem;
