import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { stores } from 'choerodon-front-boot';
import { Icon } from 'choerodon-ui';
import _ from 'lodash';
import { injectIntl } from 'react-intl';
import LinkList from '../../Component/LinkList';

const { AppState } = stores;

@inject('AppState')
@observer class TestLink extends Component {
  onOpen = (caseId) => {
    const { history } = this.props;
    const urlParams = AppState.currentMenuType;
    history.push(`/testManager/IssueManage/testCase/${caseId}?type=${urlParams.type}&id=${urlParams.id}&name=${encodeURIComponent(urlParams.name)}&organizationId=${urlParams.organizationId}`);
  };

  renderLinkList(link, i) {
    return (
      <LinkList
        issue={{
          ...link,
          typeCode: link.typeCode,
        }}
        i={i}
        onOpen={(issueId, linkedIssueId) => {
          this.onOpen(issueId);
        }}
        canDelete={false}
      />
    );
  }

  renderLinkIssues() {
    const { store } = this.props;
    const linkIssues = store.getLinkIssues;
    const group = _.groupBy(linkIssues.filter(i => i.applyType === 'test'), 'ward');
    return (
      <div className="c7n-tasks">
        {
          _.map(group, (v, k) => (
            <div key={k}>
              <div style={{ margin: '7px auto' }}>{k}</div>
              {
                _.map(v, (linkIssue, i) => this.renderLinkList(linkIssue, i))
              }
            </div>
          ))
        }
      </div>
    );
  }

  render() {
    return (
      <div id="link_task">
        <div className="c7n-title-wrapper">
          <div className="c7n-title-left">
            <Icon type="link c7n-icon-title" />
            <span>测试用例</span>
          </div>
          <div style={{
            flex: 1, height: 1, borderTop: '1px solid rgba(0, 0, 0, 0.08)', marginLeft: '14px',
          }}
          />
        </div>
        {this.renderLinkIssues()}
      </div>
    );
  }
}

export default withRouter(injectIntl(TestLink));