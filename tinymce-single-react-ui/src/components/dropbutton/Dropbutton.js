import React, { createElement, Component } from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';

import Button from '../button/Button'
import styles from './dropbutton.scss';

export default class Dropbutton extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hoverOpen: false,
      dropOpen: false
    }

  }

  render() {
    if (this.props.status !== 'ACTIVE')
      return null;


    return (
      <div
        onMouseEnter={() => { this.setState({ hoverOpen: true }) }} onMouseLeave={() => { this.setState({ hoverOpen: false }) }}
        onClick={() => { this.setState({ dropOpen: !this.state.dropOpen }) }}
      >
        {
          this.state.hoverOpen ?
            <div >

              {this.props.hoverchoices.map((hoverchoice) => {
                return (
                  hoverchoice
                )
              })}

            </div>
            : ''
        }
        {this.props.selected}
        {
          this.state.dropOpen ?
            <div>
              {this.props.dropchoices.map((dropchoice) => {
                return (
                  dropchoice
                )
              })}
            </div>
            : ''
        }
      </div>
    )
  }
}