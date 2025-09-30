/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function BookmarkEdit() {
	return (
		<div { ...useBlockProps() }>
			<h1>{ __( 'Your Liked Posts' ) }</h1>
			<ul>
				<li>
					<h2>{ __( 'Title' ) }</h2>
				</li>
				<li>
					<h2>{ __( 'Title' ) }</h2>
				</li>
			</ul>
			<div className="pagination">
				<span className="page-numbers current">
					« { __( 'Previous' ) }{ ' ' }
				</span>
				<span className="page-numbers current">{ __( '1' ) }</span>
				<span className="page-numbers">{ __( '2' ) }</span>
				<span className="page-numbers">{ __( '3' ) }</span>
				<span className="page-numbers">{ __( '4' ) }</span>
				<span className="page-numbers">{ __( '5' ) }</span>
				<span className="next page-numbers"> { __( 'Next' ) } »</span>
			</div>
		</div>
	);
}
