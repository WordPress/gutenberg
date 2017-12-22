/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { pick, castArray } from 'lodash';

/**
 * WordPress Dependencies
 */
import { Component, compose } from '@wordpress/element';
import { IconButton, withAPIData } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';

import {
	getCurrentPost,
	getAnnotations,
	isAnnotationsOpen,
	getAnnotationAnchor,
	getAnnotationFilters,
	isFetchingAnnotation,
	getLastFetchAnnotationsTime,
	getFetchedAnnotationSubstatuses,
	isSavingAnnotation,
	isTrashingAnnotation,
} from '../../store/selectors';

import {
	fetchAnnotations,
	saveAnnotation,
	trashAnnotation,
	closeAnnotations,
} from '../../store/actions';

import AnnotationsList from './annotations-list';
import AnnotationForm from './annotation-form';

/**
 * Annotations
 */
class Annotations extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );

		this.state = {
			isEditing: false,
		};
		this.node = null;
		this.rafHandle = null;

		this.bindNode = this.bindNode.bind( this );
		this.isLarge = this.isLarge.bind( this );
		this.maybeFetch = this.maybeFetch.bind( this );
		this.toggleWindowEvents = this.toggleWindowEvents.bind( this );
		this.throttledSetOffset = this.throttledSetOffset.bind( this );
		this.setOffset = this.setOffset.bind( this );
		this.getOffsetPosition = this.getOffsetPosition.bind( this );
		this.getListProps = this.getListProps.bind( this );
		this.getFormProps = this.getFormProps.bind( this );
		this.userIsPostAuthor = this.userIsPostAuthor.bind( this );
		this.userIsAuthor = this.userIsAuthor.bind( this );
		this.userCan = this.userCan.bind( this );
		this.prepareHeader = this.prepareHeader.bind( this );
		this.prepareContent = this.prepareContent.bind( this );
		this.prepareFooter = this.prepareFooter.bind( this );
	}

	/**
	 * After mounted.
	 */
	componentDidMount() {
		if ( ! this.props.isOpen ) {
			return;
		}

		this.maybeFetch();
		this.setOffset();
		this.toggleWindowEvents( true );
	}

	/**
	 * Before unmounted.
	 */
	componentWillUnmount() {
		this.toggleWindowEvents( false );
	}

	/**
	 * Before re-rendering.
	 *
	 * @param {Object} nextProps Next props.
	 * @param {Object} nextState Next state.
	 *
	 * @return {?Boolean} False if shouldn't update.
	 */
	shouldComponentUpdate() {
		return this.state.isEditing ? false : true;
	}

	/**
	 * After re-rendering.
	 *
	 * @param {Object} prevProps Previous props.
	 * @param {Object} prevState Previous state.
	 */
	componentDidUpdate( prevProps ) {
		if ( ! this.props.isOpen ) {
			return;
		}

		if ( ! prevProps.isOpen ) {
			this.maybeFetch();
			this.setOffset();
			this.toggleWindowEvents( true );
		} else if ( prevProps.anchor !== this.props.anchor ) {
			this.setOffset();
		}
	}

	/**
	 * Sets node reference.
	 *
	 * @param {Object} node Node.
	 */
	bindNode( node ) {
		this.node = node;
	}

	/**
	 * Is large breakpoint?
	 *
	 * @return {Boolean} True if large.
	 */
	isLarge() {
		return window.innerWidth >= 960;
	}

	/**
	 * Maybe fetch annotations.
	 */
	maybeFetch() {
		const { filters, fetchedSubstatuses, onFetch } = this.props;
		const substatus = castArray( filters.substatus || [] );

		if ( ! substatus.every( ( _substatus ) => {
			return fetchedSubstatuses.includes( _substatus );
		} ) ) {
			onFetch( { substatus } );
		}
	}

	/**
	 * Toggles window events.
	 *
	 * @param {Boolean} on True = on, false = off.
	 */
	toggleWindowEvents( on ) {
		window.cancelAnimationFrame( this.rafHandle );
		window[ on ? 'addEventListener' : 'removeEventListener' ]( 'resize', this.throttledSetOffset );
		window[ on ? 'addEventListener' : 'removeEventListener' ]( 'scroll', this.throttledSetOffset, true );
	}

	/**
	 * Throttled offset position.
	 */
	throttledSetOffset() {
		this.rafHandle = window.requestAnimationFrame( this.setOffset );
	}

	/**
	 * Sets offset position.
	 */
	setOffset() {
		const position = this.getOffsetPosition();

		for ( const key in position ) {
			this.node.style[ key ] = position[ key ];
		}
	}

	/**
	 * Gets offset position relative to an anchor selector.
	 *
	 * @param  {?String} anchor Selector. Defaults to `.editor-post-title`.
	 *
	 * @return {Object} e.g., { top: 0, right: 0, bottom: 0, left: 0 }
	 */
	getOffsetPosition( anchor ) {
		if ( ! this.isLarge() ) {
			return { top: 0, right: 0, bottom: 0, left: 0 };
		}

		anchor = this.props.anchor || '.editor-post-title';

		const context = document.querySelector( '.editor-layout' );
		const element = context.querySelector( anchor );

		const rect = element.getBoundingClientRect();
		const outerWidth = element.offsetWidth;

		const scrollTop = document.body.scrollTop;
		const scrollLeft = document.body.scrollLeft;

		return {
			top: ( rect.top + scrollTop ) + 'px',
			right: 'auto', bottom: 'auto',
			left: ( rect.left + scrollLeft + outerWidth ) + 'px',
		};
	}

	/**
	 * Get annotation list props.
	 *
	 * @return {Object} List props.
	 */
	getListProps() {
		return pick( this.props, [
			'filters',
			'annotations',

			'userIsPostAuthor',
			'userIsAuthor',
			'userCan',

			'onEdit',
			'onSave',
			'onTrash',
			'onArchive',
			'onReply',
		] );
	}

	/**
	 * Get annotation form props.
	 *
	 * @return {Object} Form props.
	 */
	getFormProps() {
		return pick( this.props, [
			'userIsPostAuthor',
			'userIsAuthor',
			'userCan',

			'onEdit',
			'onSave',
		] );
	}

	/**
	 * Checks if user is the post author.
	 *
	 * @return {Boolean} True if user is the author.
	 */
	userIsPostAuthor() {
		const userId = this.props.user.data.id;
		const postAuthorId = this.props.post.author;

		return userId === postAuthorId;
	}

	/**
	 * Checks if user is the annotation author.
	 *
	 * @param  {Number} id An annotation ID to check.
	 *
	 * @return {Boolean} True if user is the author.
	 */
	userIsAuthor( id ) {
		const userId = this.props.user.data.id;
		const authorId = this.props.annotations[ id ].author;

		return userId === authorId;
	}

	/**
	 * Checks user capabilities.
	 *
	 * @param  {String} cap Capability to check.
	 * @param  {Number} id  An annotation ID to check.
	 *
	 * @return {Boolean}    True if user can.
	 */
	userCan( cap, id ) {
		const { user } = this.props;
		const userCan = user.data.capabilites;

		switch ( cap ) {
			case 'edit_annotations': {
				return userCan.edit_posts;
			}

			case 'delete_annotations': {
				return userCan.delete_posts;
			}

			case 'edit_annotation': {
				return userCan.edit_posts && ( this.userIsAuthor( id ) || userCan.edit_others_posts );
			}

			case 'delete_annotation': {
				return userCan.delete_posts && ( this.userIsAuthor( id ) || userCan.delete_others_posts );
			}
		}
		return false;
	}

	/**
	 * Prepares header.
	 *
	 * @return {?Object} Element.
	 */
	prepareHeader() {
		const { onClose } = this.props;

		return (
			<header className="header">
				<IconButton
					icon="no-alt"
					className="close"
					onClick={ onClose }
				/>
			</header>
		);
	}

	/**
	 * Prepares content.
	 *
	 * @return {?Object} Element.
	 */
	prepareContent() {
		if ( ! this.props.annotations.length ) {
			return null;
		}

		return (
			<div className="scroll">
				<div className="content">
					<AnnotationsList { ...this.getListProps() } />
				</div>
			</div>
		);
	}

	/**
	 * Prepares footer.
	 *
	 * @return {?Object} Element.
	 */
	prepareFooter() {
		return (
			<footer className="footer">
				<AnnotationForm { ...this.getFormProps() } />
			</footer>
		);
	}

	/**
	 * Renders component.
	 *
	 * @return {?Object} Element.
	 */
	render() {
		if ( ! this.props.isOpen ) {
			return null;
		}

		const { isOpen, isFetching, isSaving, isTrashing } = this.props;

		const className = classnames( 'editor-annotations', {
			'is-open': isOpen,
			'is-fetching': isFetching,
			'is-saving': isSaving,
			'is-trashing': isTrashing,
		} );

		return (
			<dialog
				ref={ this.bindNode }
				className={ className }
				open={ isOpen || null }
			>
				{ this.prepareHeader() }
				{ this.prepareContent() }
				{ this.prepareFooter() }
			</dialog>
		);
	}
}

const applyConnect = connect(
	( state ) => {
		const filters = getAnnotationFilters( state );

		return {
			post: getCurrentPost( state ),

			isOpen: isAnnotationsOpen( state ),
			anchor: getAnnotationAnchor( state ),

			filters, // Acquired above.
			annotations: getAnnotations( state, filters ),

			isFetching: isFetchingAnnotation( state ),
			lastFetchTime: getLastFetchAnnotationsTime( state ),
			fetchedSubstatuses: getFetchedAnnotationSubstatuses( state ),

			isSaving: isSavingAnnotation( state ),
			isTrashing: isTrashingAnnotation( state ),
		};
	},
	( dispatch ) => ( {
		onClose() {
			dispatch( closeAnnotations( ...arguments ) );
		},
		onFetch() {
			dispatch( fetchAnnotations( ...arguments ) );
		},
		onEdit() {
			/* @TODO */
		},
		onSave() {
			dispatch( saveAnnotation( ...arguments ) );
		},
		onTrash() {
			dispatch( trashAnnotation( ...arguments ) );
		},
		onArchive( newData ) {
			dispatch( saveAnnotation( { ...newData, substatus: 'archive' } ) );
		},
		onReply() {
			/* @TODO */
		},
	} ),
);

const applyWithAPIData = withAPIData( () => ( {
	user: '/wp/v2/users/me?context=edit',
} ) );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( Annotations );
