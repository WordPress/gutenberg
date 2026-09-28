import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import Navigation from '../navigation';
import SaveButton from '../save-button';
import { store as bootStore } from '../../store';
import styles from './style.module.scss';

function DashboardBackButton() {
	const dashboardLink = useSelect(
		( select ) => select( bootStore ).getDashboardLink(),
		[]
	);
	return (
		<Button
			__next40pxDefaultSize
			className={ styles[ 'back-button' ] }
			href={ dashboardLink || '/' }
			icon={ isRTL() ? chevronRight : chevronLeft }
			label={ __( 'Go to the Dashboard' ) }
		>
			{ __( 'Dashboard' ) }
		</Button>
	);
}

export default function Sidebar() {
	return (
		<div className={ styles.scrollable }>
			<DashboardBackButton />
			<div className={ styles.content }>
				<Navigation />
			</div>
			<div className={ styles.footer }>
				<SaveButton />
			</div>
		</div>
	);
}
