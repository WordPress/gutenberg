/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, FormToggle } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { toggleCoediting } from '../../../actions';
import { isCoeditingEnabled } from '../../../selectors';

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

export default connect(
	( state ) => {
		return {
			enabled: isCoeditingEnabled( state ),
		};
	},
	{ toggleCoediting }
)( CoeditingPanel );
