/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';
import { Popover, IconButton } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PublishDropdown from '../publish-dropdown';
import PublishButton from '../publish-button';
import {
	isSavingPost,
	isEditedPostSaveable,
	isEditedPostPublishable,
} from '../../selectors';

class PublishWithDropdown extends Component {
	constructor() {
		super( ...arguments );
		this.toggleDropdown = this.toggleDropdown.bind( this );
		this.closeDropdown = this.closeDropdown.bind( this );
		this.state = {
			opened: false,
		};
	}

	toggleDropdown( event ) {
		event.stopPropagation();
		this.setState( ( state ) => ( { opened: ! state.opened } ) );
	}

	closeDropdown() {
		this.setState( { opened: false } );
	}

	render() {
		const { opened } = this.state;
		const { isSaving, isPublishable, isSaveable } = this.props;
		const isButtonEnabled = ! isSaving && isPublishable && isSaveable;

		return (
			<div className="editor-publish-with-dropdown">
				<PublishButton />
				<div className="editor-publish-with-dropdown__arrow-container">
					<IconButton
						icon="arrow-down"
						onClick={ this.toggleDropdown }
						disabled={ ! isButtonEnabled }
					/>
					<Popover isOpen={ opened }>
						<PublishDropdown onSubmit={ this.closeDropdown } />
					</Popover>
				</div>
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isSaveable: isEditedPostSaveable( state ),
		isPublishable: isEditedPostPublishable( state ),
	} ),
)( PublishWithDropdown );
