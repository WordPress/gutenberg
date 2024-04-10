/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { comment } from '@wordpress/icons';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { displayShortcut } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
const isInlineCommentExperimentEnabled =
	window?.__experimentalEnableInlineComment;

class InlineCommentToolbar extends Component {
	constructor( props ) {
		super( props );
		this.onToggle = this.onToggle.bind( this );
	}
	onToggle() {
		// eslint-disable-next-line no-console
		console.log( 'comment toggled' );
	}

	render() {
		return (
			<>
				{ isInlineCommentExperimentEnabled && (
					<>
						<ToolbarGroup className="comment-group">
							<ToolbarButton
								icon={ comment }
								label={ __( 'Comment' ) }
								onClick={ this.onToggle }
								shortcut={ displayShortcut.primaryAlt( 'm' ) }
								className={
									'comment-group-button toolbar-button-with-text'
								}
							/>
						</ToolbarGroup>
					</>
				) }
			</>
		);
	}
}
export default InlineCommentToolbar;
