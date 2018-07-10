/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

function Warning( { actions, children } ) {
	return (
		<div className="editor-warning">
			<div className="editor-warning__contents">
				<div className="editor-warning__message">{ children }</div>

				{ Children.count( actions ) > 0 && (
					<div className="editor-warning__actions">
						{ Children.map( actions, ( action, i ) => (
							<span key={ i } className="editor-warning__action">
								{ action }
							</span>
						) ) }
					</div>
				) }
			</div>
		</div>
	);
}

export default Warning;
