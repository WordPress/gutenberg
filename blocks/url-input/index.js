/**
 * External dependencies
 */
import { throttle } from 'lodash';
import classnames from 'classnames';
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { UP, DOWN, ENTER } from 'utils/keycodes';
import { Spinner } from 'components';

class UrlInput extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.bindListNode = this.bindListNode.bind( this );
		this.updateSuggestions = throttle( this.updateSuggestions.bind( this ), 200 );
		this.suggestionNodes = [];
		this.state = {
			posts: [],
			showSuggestions: false,
			selectedSuggestion: null,
		};
	}

	bindListNode( ref ) {
		this.listNode = ref;
	}

	bindSuggestionNode( index ) {
		return ( ref ) => {
			this.suggestionNodes[ index ] = ref;
		};
	}

	updateSuggestions( value ) {
		if ( this.suggestionsRequest ) {
			this.suggestionsRequest.abort();
		}

		// Show the suggestions after typing at least 3 characters
		if ( value.length < 2 ) {
			this.setState( {
				showSuggestions: false,
				selectedSuggestion: null,
				loading: false,
			} );

			return;
		}

		this.setState( {
			showSuggestions: true,
			selectedSuggestion: null,
			loading: true,
		} );
		this.suggestionsRequest = new wp.api.collections.Posts().fetch( { data: {
			search: value,
			per_page: 20,
		} } );
		this.suggestionsRequest
			.then(
				( posts ) => {
					this.setState( {
						posts,
						loading: false,
					} );
				},
				( xhr ) => {
					if ( xhr.statusText === 'abort' ) {
						return;
					}
					this.setState( {
						loading: false,
					} );
				}
			);
	}

	onChange( event ) {
		this.props.onChange( event.target.value );
		this.updateSuggestions( event.target.value );
	}

	onKeyDown( event ) {
		const { selectedSuggestion, posts } = this.state;
		switch ( event.keyCode ) {
			case UP: {
				event.stopPropagation();
				const previousIndex = ! selectedSuggestion ? posts.length - 1 : selectedSuggestion - 1;
				this.setState( {
					selectedSuggestion: previousIndex,
				} );
				break;
			}
			case DOWN: {
				event.stopPropagation();
				const nextIndex = selectedSuggestion === null || ( selectedSuggestion === posts.length - 1 ) ? 0 : selectedSuggestion + 1;
				this.setState( {
					selectedSuggestion: nextIndex,
				} );
				break;
			}
			case ENTER: {
				if ( this.state.selectedSuggestion ) {
					event.stopPropagation();
					const post = this.state.posts[ this.state.selectedSuggestion ];
					this.props.onChange( post.link );
					this.setState( {
						showSuggestions: false,
					} );
				}
			}
		}
	}

	componentWillUnmount() {
		if ( this.suggestionsRequest ) {
			this.suggestionsRequest.abort();
		}
	}

	componentDidUpdate() {
		const { showSuggestions, selectedSuggestion } = this.state;
		// only have to worry about scrolling selected suggestion into view
		// when already expanded
		if ( showSuggestions && selectedSuggestion !== null && ! this.scrollingIntoView ) {
			this.scrollingIntoView = true;
			scrollIntoView( this.suggestionNodes[ selectedSuggestion ], this.listNode, {
				onlyScrollIfNeeded: true,
			} );

			setTimeout( () => {
				this.scrollingIntoView = false;
			}, 100 );
		}
	}

	render() {
		const { value } = this.props;
		const { showSuggestions, posts, selectedSuggestion, loading } = this.state;
		/* eslint-disable jsx-a11y/no-autofocus */
		return (
			<div className="blocks-url-input">
				<input
					autoFocus
					type="url"
					aria-label={ __( 'URL' ) }
					required
					value={ value }
					onChange={ this.onChange }
					placeholder={ __( 'Paste URL or type' ) }
					onKeyDown={ this.onKeyDown }
				/>

				{ ( loading ) && <Spinner /> }

				{ showSuggestions && !! posts.length &&
					<div
						className="blocks-url-input__suggestions"
						ref={ this.bindListNode }
					>
						{ posts.map( ( post, index ) => (
							<button
								key={ post.id }
								ref={ this.bindSuggestionNode( index ) }
								className={ classnames( 'blocks-url-input__suggestion', {
									'is-selected': index === selectedSuggestion,
								} ) }
								onClick={ () => this.props.onChange( post.link ) }
							>
								{ post.title.rendered }
							</button>
						) ) }
					</div>
				}
			</div>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

export default UrlInput;
