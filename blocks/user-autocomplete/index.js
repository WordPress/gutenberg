/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Autocomplete } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

class UserAutocomplete extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			users: [],
		};
		this.validateNode = this.validateNode.bind( this );
		this.onSelect = this.onSelect.bind( this );
	}

	componentDidMount() {
		const usersCollection = new wp.api.collections.Users();
		usersCollection.fetch().then( ( users ) => {
			this.setState( { users } );
		} );
	}

	validateNode( textNode ) {
		return textNode.parentElement.closest( 'a' ) === null;
	}

	onSelect( option, range ) {
		const { user } = option;
		const mention = document.createElement( 'a' );
		mention.href = user.link;
		mention.textContent = '@' + user.name;
		range.insertNode( mention );
		range.setStartAfter( mention );
		range.deleteContents();
	}

	render() {
		const { children } = this.props;
		const { users } = this.state;

		const options = users.map( ( user ) => {
			return {
				user: user,
				label: [
					<img key="avatar" alt="" src={ user.avatar_urls[ 24 ] } />,
					<span key="name" className="name">{ user.name }</span>,
					<span key="slug" className="slug">{ user.slug }</span>,
				],
				keywords: [ user.slug, user.name ],
			};
		} );

		return (
			<Autocomplete
				triggerPrefix="@"
				allowNode={ this.validateNode }
				options={ options }
				onSelect={ this.onSelect }
				className="blocks-user-autocomplete"
			>
				{ children }
			</Autocomplete>
		);
	}
}

export default UserAutocomplete;
