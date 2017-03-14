import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import * as Icons from '../../external/dashicons'
import Button from '../button/Button'
import styles from './toolbar.scss'

export default class Toolbar extends React.Component {
	render() {
		return (
			<div>
				<div className={styles.toolbar}>
					<Button>
						<Icons.EditorBoldIcon />
					</Button>
					<Button>
						<Icons.EditorItalicIcon />
					</Button>
					<Button>
						<Icons.EditorStrikethroughIcon />
					</Button>
				</div>
				<div className={styles.toolbar}>
					<div>
						<Button>
							<Icons.EditorAlignLeftIcon />
						</Button>
						<Button>
							<Icons.EditorAlignCenterIcon />
						</Button>
						<Button>
							<Icons.EditorAlignRightIcon />
						</Button>
					</div>

				</div>
			</div>
		)
	}
}