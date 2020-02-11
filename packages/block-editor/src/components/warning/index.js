/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { Dropdown, Button, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreHorizontal } from '@wordpress/icons';

function Warning( { className, actions, children, secondaryActions } ) {
	return (
		<div className={ classnames( className, 'block-editor-warning' ) }>
			<div className="block-editor-warning__contents">
				<p className="block-editor-warning__message">{ children }</p>

				{ Children.count( actions ) > 0 && (
					<div className="block-editor-warning__actions">
						{ Children.map( actions, ( action, i ) => (
							<span
								key={ i }
								className="block-editor-warning__action"
							>
								{ action }
							</span>
						) ) }
					</div>
				) }
			</div>

			{ secondaryActions && (
				<Dropdown
					className="block-editor-warning__secondary"
					position="bottom left"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							icon={ moreHorizontal }
							label={ __( 'More options' ) }
							onClick={ onToggle }
							aria-expanded={ isOpen }
						/>
					) }
					renderContent={ () => (
						<MenuGroup>
							{ secondaryActions.map( ( item, pos ) => (
								<MenuItem onClick={ item.onClick } key={ pos }>
									{ item.title }
								</MenuItem>
							) ) }
						</MenuGroup>
					) }
				/>
			) }
		</div>
	);
}

export default Warning;
