/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter, flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, withAPIData, withInstanceId } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );

		this.setAuthorId = this.setAuthorId.bind( this );
	}

	setAuthorId( event ) {
		const { onUpdateAuthor } = this.props;
		const { value } = event.target;
		onUpdateAuthor( Number( value ) );
	}

	getAuthors() {
		// While User Levels are officially deprecated, the behavior of the
		// existing users dropdown on `who=authors` tests `user_level != 0`
		//
		// See: https://github.com/WordPress/WordPress/blob/a193916/wp-includes/class-wp-user-query.php#L322-L327
		// See: https://codex.wordpress.org/Roles_and_Capabilities#User_Levels
		const { users } = this.props;
		return filter( users.data, ( user ) => {
			return user.capabilities.level_1;
		} );
	}

	render() {
		const authors = this.getAuthors();
		if ( authors.length < 2 ) {
			return null;
		}

		const { postAuthor, instanceId } = this.props;
		const selectId = 'post-author-selector-' + instanceId;

		// Disable reason: A select with an onchange throws a warning

		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<PanelRow>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				<select
					id={ selectId }
					value={ postAuthor }
					onChange={ this.setAuthorId }
					className="editor-post-author__select"
				>
					{ authors.map( ( author ) => (
						<option key={ author.id } value={ author.id }>{ author.name }</option>
					) ) }
				</select>
			</PanelRow>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

const applyConnect = connect(
	( state ) => {
		return {
			postAuthor: getEditedPostAttribute( state, 'author' ),
		};
	},
	{
		onUpdateAuthor( author ) {
			return editPost( { author } );
		},
	},
);

const applyWithAPIData = withAPIData( () => {
	return {
		users: '/wp/v2/users?context=edit&per_page=100',
	};
} );

export default flowRight( [
	applyConnect,
	applyWithAPIData,
	withInstanceId,
] )( PostAuthor );
