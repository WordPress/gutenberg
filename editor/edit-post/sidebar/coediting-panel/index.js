/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, FormToggle } from '@wordpress/components';
import { query } from '@wordpress/data';
import { compose } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import { toggleCoediting } from 'coediting/store';

function CoeditingPanel( { enabled = false, ...props } ) {
	const handleToggle = () => props.toggleCoediting();

	return (
		<PanelBody title={ __( 'Coediting' ) } initialOpen={ false }>
			<PanelRow>
				<label htmlFor="coediting-toggle">{ __( 'Enable Coediting' ) }</label>
				<FormToggle
					checked={ enabled }
					onChange={ handleToggle }
					showHint={ false }
					id="coediting-toggle"
				/>
			</PanelRow>
		</PanelBody>
	);
}

const withConnect = connect(
	null,
	{ toggleCoediting }
);

const withQuery = query(
	( select ) => ( {
		enabled: select( 'core/coediting', 'isCoeditingEnabled' ),
	} ),
);

export default compose(
	withConnect,
	withQuery,
)( CoeditingPanel );
