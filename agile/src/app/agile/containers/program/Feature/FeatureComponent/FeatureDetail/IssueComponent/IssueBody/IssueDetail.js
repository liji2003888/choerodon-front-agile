import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Icon, Button } from 'choerodon-ui';
import _ from 'lodash';
import { injectIntl, FormattedMessage } from 'react-intl';
import IssueField from './IssueField';

@inject('AppState')
@observer class IssueCommit extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
  }

  render() {
    const { edit, editDes } = this.state;
    const { store } = this.props;

    return (
      <div className="c7n-details">
        <div id="detail">
          <div className="c7n-title-wrapper" style={{ marginTop: 0 }}>
            <div className="c7n-title-left">
              <Icon type="error_outline c7n-icon-title" />
              <span>详情</span>
            </div>
            <div style={{
              flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
            }}
            />
          </div>
          <IssueField store={store} />
        </div>
      </div>
    );
  }
}

export default withRouter(injectIntl(IssueCommit));
