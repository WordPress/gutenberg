/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { WordCounter } from 'utils';
import { PanelHeader, FormToggle, withInstanceId } from 'components';

function WordCount() {

	console.log( WordCounter.bind(this) );
	return (
		<PanelHeader label={ __( 'Word Count' ) } >
			<div>Count</div>
		</PanelHeader>
	);
}
export default connect(
	undefined,
	undefined
)( WordCount );
