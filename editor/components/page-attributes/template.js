/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withContext, withInstanceId } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

export function PageTemplate( { availableTemplates, selectedTemplate, instanceId, onUpdate } ) {
	if ( isEmpty( availableTemplates ) ) {
		return null;
	}
	const selectId = `template-selector-${ instanceId }`;
	const onEventUpdate = ( event ) => onUpdate( event.target.value );
	return (
		<div className="editor-page-attributes__template">
			<label htmlFor={ selectId }>{ __( 'Template:' ) }</label>
			<select
				id={ selectId }
				value={ selectedTemplate }
				onBlur={ onEventUpdate }
				onChange={ onEventUpdate }
			>
				{ map( { '': __( 'Default template' ), ...availableTemplates }, ( templateName, templateSlug ) => (
					<option key={ templateSlug } value={ templateSlug }>{ templateName }</option>
				) ) }
			</select>
		</div>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			selectedTemplate: getEditedPostAttribute( state, 'template' ),
		};
	},
	{
		onUpdate( templateSlug ) {
			return editPost( { template: templateSlug || '' } );
		},
	}
);

const applyWithContext = withContext( 'editor' )(
	( settings ) => ( {
		availableTemplates: settings.availableTemplates,
	} )
);

export default compose(
	applyConnect,
	applyWithContext,
	withInstanceId,
)( PageTemplate );
