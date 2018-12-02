/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { Dropdown, IconButton, NavigableMenu, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function Warning( { className, actions, children, secondaryActions } ) {
	return (
		<div className={ classnames( className, 'editor-warning' ) }>
			<div className="editor-warning__contents">
				<p className="editor-warning__message">{ children }</p>

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

			{ secondaryActions && (
				<Dropdown
					className="editor-warning__secondary"
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
						<NavigableMenu orientation="vertical" className="editor-warning-menu__content">
							{ secondaryActions.map( ( item, pos ) =>
								<MenuItem onClick={ item.onClick } key={ pos }>
									{ item.title }
								</MenuItem>
							) }
						</NavigableMenu>
					) }
				/>
			) }
		</div>
	);
}

export default Warning;
