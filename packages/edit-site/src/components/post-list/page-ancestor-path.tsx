import { __ } from '@wordpress/i18n';

export default function PageAncestorPath( { labels }: { labels: string[] } ) {
	if ( ! labels.length ) {
		return null;
	}
	return (
		<div role="group" aria-label={ __( 'Breadcrumbs' ) }>
			<ul className="page-ancestor-path">
				{ labels.map( ( label, index ) => (
					<li key={ index }>
						<span>{ label }</span>
						{ index < labels.length - 1 && (
							<span
								className="page-ancestor-path__separator"
								aria-hidden="true"
							>
								/
							</span>
						) }
					</li>
				) ) }
			</ul>
		</div>
	);
}
