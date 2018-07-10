/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { Dropdown, IconButton, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function Warning( { className, primaryActions, children, hiddenActions } ) {
	return (
		<div className={ classnames( className, 'editor-warning' ) }>
			<div className="editor-warning__contents">
				<p className="editor-warning__message">{ children }</p>

				{ Children.count( primaryActions ) > 0 && (
					<div className="editor-warning__actions">
						{ Children.map( primaryActions, ( action, i ) => (
							<span key={ i } className="editor-warning__action">
								{ action }
							</span>
						) ) }
					</div>
				) }
			</div>

			{ hiddenActions && (
				<div className="editor-warning__hidden">
					<Dropdown
						className="edit-post-more-menu"
						position="bottom left"
						renderToggle={ ( { isOpen, onToggle } ) => (
							<IconButton
								icon="ellipsis"
								label={ __( 'More options' ) }
								onClick={ onToggle }
								aria-expanded={ isOpen }
							/>
						) }
						renderContent={ () => (
							<div className="edit-post-more-menu__content">
								<MenuGroup label={ __( 'More options' ) }>
									{ hiddenActions.map( ( item, pos ) =>
										<MenuItem onClick={ item.onClick } key={ pos }>
											{ item.title }
										</MenuItem>
									) }
								</MenuGroup>
							</div>
						) }
					/>
				</div>
			) }
		</div>
	);
}

export default Warning;
