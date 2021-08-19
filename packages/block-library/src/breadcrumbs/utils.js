export const buildBreadcrumb = ( {
	crumbTitle,
	separator,
	showSeparator,
	addLeadingSeparator,
	key,
} ) => {
	let separatorSpan;
	let crumbAnchor;

	if ( separator ) {
		separatorSpan = (
			<span className="wp-block-breadcrumbs__separator">
				{ separator }
			</span>
		);
	}

	if ( crumbTitle ) {
		/* eslint-disable jsx-a11y/anchor-is-valid */
		crumbAnchor = (
			<a href="#" onClick={ ( event ) => event.preventDefault() }>
				{ crumbTitle }
			</a>
		);
		/* eslint-enable */
	}

	return (
		<li className="wp-block-breadcrumbs__item" key={ key }>
			{ addLeadingSeparator ? separatorSpan : null }
			{ crumbAnchor }
			{ showSeparator ? separatorSpan : null }
		</li>
	);
};
