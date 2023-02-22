export function Content( { props, attributes } ) {
	const { url, title, image, icon } = attributes;
	return (
		<a
			{ ...props }
			href={ url }
			className={
				image ? props.className + ' has-image' : props.className
			}
		>
			{ image && <img src={ image } alt={ title } /> }
			<div>
				<strong>{ title }</strong>
				{ icon && (
					<img
						className="link-preview__icon"
						src={ icon }
						alt={ new URL( url ).host }
					/>
				) }
				{ new URL( url ).host.replace( /^www\./, '' ) }
			</div>
		</a>
	);
}
