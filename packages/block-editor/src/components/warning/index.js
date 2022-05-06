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

export class GutenbergWarningInner extends window.HTMLElement {}

export class GutenbergWarning extends window.HTMLElement {
	connectedCallback() {
		const shadowRoot = this.attachShadow( { mode: 'closed' } );
		shadowRoot.innerHTML = `
      <style> 

			:host { 
        display: contents 
      }

			gutenberg-warning-inner {
				display: contents;
			}

			.block-editor-warning {
				align-items: center;
				display: flex;
				flex-wrap: wrap;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
				padding: 1em;
				border: 1px solid #1e1e1e;
				border-radius: 2px;
				background-color: #fff;
			}

			.block-editor-warning .block-editor-warning__message {
				line-height: 1.4;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
				font-size: 13px;
				color: #1e1e1e;
				margin: 0;
			}
			.block-editor-warning p.block-editor-warning__message.block-editor-warning__message {
				min-height: auto;
			}
			.block-editor-warning .block-editor-warning__contents {
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				flex-wrap: wrap;
				align-items: baseline;
				width: 100%;
			}
			.block-editor-warning .block-editor-warning__actions {
				display: flex;
				margin-top: 1em;
			}
			.block-editor-warning .block-editor-warning__action {
				margin: 0 8px 0 0;
			}

			.block-editor-warning__secondary {
				margin: auto 0 auto 8px;
			}

			.components-popover.block-editor-warning__dropdown {
				z-index: 99998;
			}
      </style> 
      `;
		this.style = 'all: initial;';

		const inner = this.querySelector( 'gutenberg-warning-inner' );
		const innerClone = inner.cloneNode( true );
		shadowRoot.appendChild( innerClone );
	}
}

window.customElements.define( 'gutenberg-warning', GutenbergWarning );
window.customElements.define(
	'gutenberg-warning-inner',
	GutenbergWarningInner
);

function Warning( { className, actions, children, secondaryActions } ) {
	return (
		<gutenberg-warning>
			<gutenberg-warning-inner>
				<div
					className={ classnames(
						className,
						'block-editor-warning'
					) }
				>
					<div className="block-editor-warning__contents">
						<p className="block-editor-warning__message">
							{ children }
						</p>

						{ ( Children.count( actions ) > 0 ||
							secondaryActions ) && (
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
															onClick={
																item.onClick
															}
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
			</gutenberg-warning-inner>
		</gutenberg-warning>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/warning/README.md
 */
export default Warning;
