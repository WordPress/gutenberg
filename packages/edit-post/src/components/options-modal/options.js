/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

function Option( { label, isChecked, onChange } ) {
	return (
		<CheckboxControl
			className="edit-post-options-modal__option"
			label={ label }
			checked={ isChecked }
			onChange={ onChange }
		/>
	);
}

class DeferredOption extends Component {
	constructor( { isChecked } ) {
		super( ...arguments );
		this.state = {
			isChecked,
		};
	}

	componentWillUnmount() {
		if ( this.state.isChecked !== this.props.isChecked ) {
			this.props.onChange( this.state.isChecked );
		}
	}

	render() {
		return (
			<Option
				label={ this.props.label }
				isChecked={ this.state.isChecked }
				onChange={ ( isChecked ) => this.setState( { isChecked } ) }
			/>
		);
	}
}

export const EnablePublishSidebarOption = compose(
	withSelect( ( select ) => ( {
		isChecked: select( 'core/editor' ).isPublishSidebarEnabled(),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { enablePublishSidebar, disablePublishSidebar } = dispatch( 'core/editor' );
		return {
			onChange: ( isEnabled ) => ( isEnabled ? enablePublishSidebar() : disablePublishSidebar() ),
		};
	} )
)( Option );

export const EnableTipsOption = compose(
	withSelect( ( select ) => ( {
		isChecked: select( 'core/nux' ).areTipsEnabled(),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { enableTips, disableTips } = dispatch( 'core/nux' );
		return {
			onChange: ( isEnabled ) => ( isEnabled ? enableTips() : disableTips() ),
		};
	} )
)(
	// Using DeferredOption here means enableTips() is called when the Options
	// modal is dismissed. This stops the NUX guide from appearing above the
	// Options modal, which looks totally weird.
	DeferredOption
);

export const EnablePanelOption = compose(
	withSelect( ( select, { panelName } ) => ( {
		isChecked: select( 'core/edit-post' ).isEditorPanelEnabled( panelName ),
	} ) ),
	withDispatch( ( dispatch, { panelName } ) => ( {
		onChange: () => dispatch( 'core/edit-post' ).toggleEditorPanelEnabled( panelName ),
	} ) )
)( Option );
