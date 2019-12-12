/**
 * External dependencies
 */
import classnames from 'classnames';
import { match } from 'css-mediaquery';
import { difference } from 'lodash';
/**
 * WordPress dependencies
 */
import { navigateRegions, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

const styleStorage = {};

function EditorRegions( { footer, header, sidebar, content, publish, className } ) {
	const [ contentWidth, updatecontentWidth ] = useState( {} );
	const getMQs = ( width ) => {
		const leastWidth = width < window.innerWidth ? `${ width }px` : `${ window.innerWidth }px`;
		Object.values( document.styleSheets )
			.filter( ( sheet ) => sheet.href && ( sheet.href.includes( 'editor-style' ) || sheet.href.includes( 'block-editor' ) || sheet.href.includes( 'block-library' ) ) )
			.forEach( ( sheet, index ) => {
				if ( ! styleStorage[ index ] ) {
					styleStorage[ index ] = [];
				} else {
					const rulesToInsert = styleStorage[ index ].filter( ( rule ) => rule.media && match( rule.media.mediaText, { type: 'screen', width: leastWidth } ) );
					rulesToInsert.forEach( ( rule ) => sheet.insertRule( rule.cssText, sheet.cssRules.length ) );
					styleStorage[ index ] = difference( styleStorage[ index ], rulesToInsert );
				}
				const rulesToDelete = Object.values( sheet.cssRules ).reduce( function( result, rule, rulesIndex ) {
					if ( rule.media && ! match( rule.media.mediaText, { type: 'screen', width: leastWidth } ) ) {
						result.push( rulesIndex );
					}
					return result;
				}, [] );
				let countDeleted = 0;
				rulesToDelete.forEach( ( item ) => {
					if ( Number.isInteger( item ) ) {
						styleStorage[ index ].push( sheet.cssRules[ item - countDeleted ] );
						sheet.deleteRule( item - countDeleted );
						countDeleted++;
					}
				} );
			} );
	};
	return (
		<div className={ classnames( className, 'edit-post-editor-regions' ) }>
			{ !! header && (
				<div
					className="edit-post-editor-regions__header"
					role="region"
					/* translators: accessibility text for the top bar landmark region. */
					aria-label={ __( 'Editor top bar' ) }
					tabIndex="-1"
				>
					{ header }
				</div>
			) }
			<div className="edit-post-editor-regions__body">
				<div className="edit-post-editor-regions__width-toggles">
					<Button isTertiary isLarge onClick={ () => {
						updatecontentWidth( {} );
						getMQs( 2000 );
					} }>Desktop</Button>
					<Button isTertiary isLarge onClick={ () => {
						updatecontentWidth( { width: '780px', margin: '0 auto', flexGrow: 0 } );
						getMQs( 780 );
					} }>Tablet</Button>
					<Button isTertiary isLarge onClick={ () => {
						updatecontentWidth( { width: '340px', margin: '0 auto', flexGrow: 0 } );
						getMQs( 340 );
					} }>Mobile</Button>
				</div>
				<div
					className="edit-post-editor-regions__content"
					role="region"
					/* translators: accessibility text for the content landmark region. */
					aria-label={ __( 'Editor content' ) }
					tabIndex="-1"
					style={ contentWidth }
				>
					{ content }
				</div>
				{ !! sidebar && (
					<div
						className="edit-post-editor-regions__sidebar"
						role="region"
						/* translators: accessibility text for the settings landmark region. */
						aria-label={ __( 'Editor settings' ) }
						tabIndex="-1"
					>
						{ sidebar }
					</div>
				) }
				{ !! publish && (
					<div
						className="edit-post-editor-regions__publish"
						role="region"
						/* translators: accessibility text for the publish landmark region. */
						aria-label={ __( 'Editor publish' ) }
						tabIndex="-1"
					>
						{ publish }
					</div>
				) }
			</div>
			{ !! footer && (
				<div
					className="edit-post-editor-regions__footer"
					role="region"
					/* translators: accessibility text for the footer landmark region. */
					aria-label={ __( 'Editor footer' ) }
					tabIndex="-1"
				>
					{ footer }
				</div>
			) }
		</div>
	);
}

export default navigateRegions( EditorRegions );
