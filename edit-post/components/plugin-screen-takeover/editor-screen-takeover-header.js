import { NavigableToolbar } from '../../../editor/components';

const ScreenTakeoverHeader = ( { icon, title } ) => {
	return (
		<NavigableToolbar
			className={ 'edit-post-plugin-screen-takeover__editor-screen-takeover-header' }
		>
			<div>
				{ icon }
				<span>
					{ title }
				</span>
			</div>
			<button>
				close
			</button>
		</NavigableToolbar>
	);
};

export default ScreenTakeoverHeader;
