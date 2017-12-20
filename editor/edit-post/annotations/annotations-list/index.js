/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { pick } from 'lodash';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, compose } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import {
	isFetchingAnnotation,
} from '../../../store/selectors';

import {
	extractTopLevelAnnotations,
	queryChildAnnotations,
	orderAnnotationsByDate,
} from '../../../utils/annotations';

import Annotation from '../annotation';

/**
 * Annotations List
 */
class AnnotationsList extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );

		this.state = {};

		this.prepareIssues = this.prepareIssues.bind( this );
		this.prepareAnnotations = this.prepareAnnotations.bind( this );
		this.prepareChildren = this.prepareChildren.bind( this );
		this.getItemProps = this.getItemProps.bind( this );
	}

	/**
	 * Prepares issues.
	 *
	 * @return {?Object} Element.
	 */
	prepareIssues() {
		const output = [];

		const { annotations, isFetching } = this.props;
		const haveAnnotations = annotations.length > 0;

		if ( ! haveAnnotations && isFetching ) {
			output.push(
				<div className="fetching">
					{ __( 'fetching annotations...' ) } <Spinner />
				</div>
			);
		}

		if ( output.length ) {
			return (
				<div className="issues">
					{ output }
				</div>
			);
		}
	}

	/**
	 * Prepares annotations.
	 *
	 * @return {?Object} Element.
	 */
	prepareAnnotations() {
		const output = [];

		const annotations = orderAnnotationsByDate(
			extractTopLevelAnnotations( this.props.annotations )
		);

		annotations.forEach( ( annotation ) => {
			output.push(
				<li key={ annotation.id }>
					<Annotation { ...this.getItemProps( annotation, true ) } />
					{ this.prepareChildren( annotation.id ) }
				</li>
			);
		} );

		if ( output.length ) {
			return (
				<ol className="parents">
					{ output }
				</ol>
			);
		}
	}

	/**
	 * Prepares children.
	 *
	 * @param  {Number} parentId Parent ID.
	 *
	 * @return {Object}          Element.
	 */
	prepareChildren( parentId ) {
		const output = [];

		const annotations = orderAnnotationsByDate(
			queryChildAnnotations( this.props.annotations, [ parentId ], null, false )
		);

		annotations.forEach( ( annotation ) => {
			output.push(
				<li key={ annotation.id }>
					<Annotation { ...this.getItemProps( annotation ) } />
					{ this.prepareChildren( annotation.id ) }
				</li>
			);
		} );

		if ( output.length ) {
			return (
				<ol key={ 'children-of-' + parentId } className="children">
					{ output }
				</ol>
			);
		}
	}

	/**
	 * Get an item's props.
	 *
	 * @param  {Object}   annotation An annotation.
	 * @param  {?Boolean} isTop      A top-level item?
	 *
	 * @return {Object} Item props.
	 */
	getItemProps( annotation, isTop ) {
		return {
			id: annotation.id,
			isTop: isTop || false,
			...pick( this.props, [
				'userIsPostAuthor',
				'userIsAuthor',
				'userCan',

				'onEdit',
				'onSave',
				'onTrash',
				'onArchive',
				'onReply',
			] ),
		};
	}

	/**
	 * Renders component.
	 *
	 * @return {?Object} Element.
	 */
	render() {
		const issues = this.prepareIssues();
		const annotations = issues ? null : this.prepareAnnotations();

		if ( issues || annotations ) {
			return (
				<div
					className="editor-annotations-list"
					aria-label={ __( 'Annotations' ) }
				>
					{ issues }
					{ annotations }
				</div>
			);
		}

		return null;
	}
}

const applyConnect = connect(
	( state ) => ( {
		isFetching: isFetchingAnnotation( state ),
	} ),
);

export default compose( [
	applyConnect,
] )( AnnotationsList );
