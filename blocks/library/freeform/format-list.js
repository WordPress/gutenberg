/**
 * WordPress dependencies
 */
import { Dashicon } from 'components';

/**
 * Internal dependencies
 */
import './format-list.scss';

function FormatList( props ) {
	const { formats = [ '' ], selected = 0 } = props;
	return (
		<div className="editor-format-list">
			<div className="formats">
				{ formats.map( ( format, i ) => (
					<span key={ format } className={ selected === i ? 'active' : null }>
						{ format }<br />
					</span>
				) ) }
			</div>
			<Dashicon icon="arrow-down" />
		</div>
	);
}

export default FormatList;
