/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Dropdown, Dashicon, IconButton, Toolbar, NavigableMenu } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';

const HeadingIcon = ( { subscript } ) => (
	<span className="core-blocks-heading__icon" data-subscript={ subscript }>
		<Dashicon icon="heading" />
	</span>
);

const HeadingStylesToolbar = ( { value, onChange } ) => (
	<Dropdown
		className="core-blocks-heading__styles-toolbar"
		contentClassName="core-blocks-heading__styles-toolbar-popover"
		renderToggle={ ( { onToggle, isOpen } ) => {
			const openOnArrowDown = ( event ) => {
				if ( ! isOpen && event.keyCode === keycodes.DOWN ) {
					event.preventDefault();
					event.stopPropagation();
					onToggle();
				}
			};
			const label = __( 'Change heading style' );

			return (
				<Toolbar>
					<IconButton
						icon={ <HeadingIcon subscript={ value.substring( 1 ) } /> }
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
						tooltip={ label }
						onKeyDown={ openOnArrowDown }
					>
						<Dashicon icon="arrow-down" />
					</IconButton>
				</Toolbar>
			);
		} }
		renderContent={ ( { onClose } ) => (
			<div>
				<span
					className="core-blocks-heading__styles-toolbar-menu-title"
				>
					{ __( 'Heading style:' ) }
				</span>
				<NavigableMenu
					role="menu"
					aria-label={ __( 'Heading styles' ) }
				>
					{ '123456'.split( '' ).map( ( level ) => (
						<IconButton
							key={ `heading${ level }` }
							icon={ <HeadingIcon subscript={ level } /> }
							subscript={ level }
							className={ classnames(
								'core-blocks-heading__styles-toolbar-menu-item', {
									'is-active': value === 'H' + level,
								}
							) }
							onClick={ () => {
								onChange( 'H' + level );
								onClose();
							} }
							role="menuitem"
						>
							{ sprintf( __( 'Heading %s' ), level ) }
						</IconButton>
					) ) }
				</NavigableMenu>
			</div>
		) }
	/>
);

export default HeadingStylesToolbar;
