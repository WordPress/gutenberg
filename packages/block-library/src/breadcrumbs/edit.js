/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	RangeControl,
	Notice,
	PanelBody,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */

export default function BreadcrumbsEdit( {
	attributes: { nestingLevel, separator, textAlign },
	setAttributes,
	context: { postType, postId },
} ) {
	const post = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			),
		[ postType, postId ]
	);

	// const { editEntityRecord } = useDispatch( coreStore );

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	if ( ! post ) {
		return null;
	}

	// const { title = '', link } = post;

	console.log( post );

	// if ( postType && postId ) {
	// 	titleElement = (
	// 		<PlainText
	// 			tagName={ TagName }
	// 			placeholder={ __( 'No Title' ) }
	// 			value={ title }
	// 			onChange={ ( value ) =>
	// 				editEntityRecord( 'postType', postType, postId, {
	// 					title: value,
	// 				} )
	// 			}
	// 			__experimentalVersion={ 2 }
	// 			{ ...( isLink ? {} : blockProps ) }
	// 		/>
	// 	);
	// }

	const placeholderItems = [
		__( 'Root' ),
		__( 'Top level page' ),
		__( 'Child page' ),
	];

	const placeholder = placeholderItems.map( ( item, index ) => {
		const inner = [];
		inner.push(
			<a href="#" className="wp-block-breadcrumbs__separator">
				{ item }
			</a>
		);
		if ( index !== placeholderItems.length - 1 && separator ) {
			inner.push( <span>{ separator }</span> );
		}
		return (
			<li className="wp-block-breadcrumbs__item" key={ index }>
				{ ' ' }
				{ inner }
			</li>
		);
	} );

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Breadcrumbs settings' ) }>
					<RangeControl
						label={ __( 'Nesting level' ) }
						value={ nestingLevel }
						onChange={ ( value ) =>
							setAttributes( { nestingLevel: value } )
						}
						min={ 0 }
						max={ Math.max( 10, nestingLevel ) }
					/>
					{ nestingLevel === 0 && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'All nesting levels will be displayed. Update this setting to reduce nesting level.'
							) }
						</Notice>
					) }
					<TextControl
						label={ __( 'Separator character' ) }
						help={ __(
							'Enter a character to display between page items.'
						) }
						value={ separator || '' }
						placeholder={ __( 'e.g. /' ) }
						onChange={ ( nextValue ) =>
							setAttributes( {
								separator: nextValue,
							} )
						}
						autoCapitalize="none"
						autoComplete="off"
					/>
				</PanelBody>
			</InspectorControls>
			<ol { ...blockProps }>{ placeholder }</ol>
		</>
	);
}
