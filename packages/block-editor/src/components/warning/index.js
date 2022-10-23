/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreHorizontal } from '@wordpress/icons';

function Warning( { className, actions, children, secondaryActions } ) {
	return (
		<div style={ { display: 'contents', all: 'initial' } }>
			<div className={ classnames( className, 'block-editor-warning' ) }>
				<div className="block-editor-warning__contents">
					<p className="block-editor-warning__message">
						{ children }
					</p>

					{ ( Children.count( actions ) > 0 || secondaryActions ) && (
						<div className="block-editor-warning__actions">
							{ Children.count( actions ) > 0 &&
								Children.map( actions, ( action, i ) => (
									<span
										key={ i }
										className="block-editor-warning__action"
									>
										{ action }
									</span>
								) ) }
							{ secondaryActions && (
								<DropdownMenu
									className="block-editor-warning__secondary"
									icon={ moreHorizontal }
									label={ __( 'More options' ) }
									popoverProps={ {
										position: 'bottom left',
										className:
											'block-editor-warning__dropdown',
									} }
									noIcons
								>
									{ () => (
										<MenuGroup>
											{ secondaryActions.map(
												( item, pos ) => (
													<MenuItem
														onClick={ item.onClick }
														key={ pos }
													>
														{ item.title }
													</MenuItem>
												)
											) }
										</MenuGroup>
									) }
								</DropdownMenu>
							) }
						</div>
					) }
				</div>
			</div>
		</div>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/warning/README.md
 */
export default Warning;
