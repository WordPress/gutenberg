import clsx from 'clsx';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import type { WarningProps } from './types';

function Warning( {
	className,
	actions,
	children,
	secondaryActions,
}: WarningProps ) {
	return (
		<div style={ { display: 'contents', all: 'initial' } }>
			<div className={ clsx( className, 'block-editor-warning' ) }>
				<div className="block-editor-warning__contents">
					<p className="block-editor-warning__message">
						{ children }
					</p>

					{ /* An absent length compares as `false`. */ }
					{ ( ( actions?.length as number ) > 0 ||
						secondaryActions ) && (
						<div className="block-editor-warning__actions">
							{ ( actions?.length as number ) > 0 &&
								actions!.map( ( action, i ) => (
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
									icon={ moreVertical }
									label={ __( 'More options' ) }
									popoverProps={ {
										placement: 'bottom-end',
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
