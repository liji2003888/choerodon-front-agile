/*eslint-disable */
import {
  observable, action, computed, toJS, extendObservable,
} from 'mobx';
import axios from 'axios';
import { find, findIndex, max } from 'lodash';
import { stores } from 'choerodon-front-boot';
import { getBoard, featureToBoard, featureBoardMove, getSideFeatures } from '../../../api/BoardFeatureApi'

const { AppState } = stores;
class BoardStore {
  @observable resizing = false;

  @observable featureListVisible = false;

  @observable activePi = {};

  @observable featureList = [];

  @observable projects = [];

  @observable sprints = [];

  @observable connections = [];

  @observable currentSprint = {};

  loadData = () => {

    getBoard().then(({
      boardDepends,
      piCode,
      piId,
      sprints,
      teamProjects
    }) => {
      this.init({
        boardDepends,
        piCode,
        piId,
        sprints,
        teamProjects
      });
    })

  }

  @action init = ({
    boardDepends,
    piCode,
    piId,
    sprints,
    teamProjects: projects
  }) => {
    this.sprints = sprints;
    this.projects = projects;
    this.activePi = {
      piCode,
      piId,
    }
    this.connections = boardDepends;
  }


  loadFeatureList = () => {
    getSideFeatures(this.activePi.piId, {}).then(feature => {
      this.setFeatureList(feature)
    })
  }

  @action setFeatureListVisible(featureListVisible) {
    this.featureListVisible = featureListVisible;
  }

  @action setFeatureList(featureList) {
    this.featureList = featureList;
  }
  @action test() {
    this.sprints[0].columnWidth = 3 - this.sprints[0].columnWidth;
  }

  @action setResizing(resizing) {
    this.resizing = resizing;
  }

  @action setCurrentSprint(currentSprint) {
    this.currentSprint = currentSprint;
  }

  @action setSprintWidth(index, width) {
    if (width !== this.sprints[index].columnWidth) {
      // console.log(index, width);
      this.sprints[index].columnWidth = width;
    }
  }
  @action sortIssues = ({
    projectIndex, sprintIndex, index, issue: insertIssue, atIndex, id
  }) => {
    this.projects.forEach(project => {
      project.teamSprints.forEach(sprint => {
        sprint.boardFeatures.forEach((issue, i) => {
          if (issue.id === id) {
            sprint.boardFeatures.splice(i, 1)
            this.projects[projectIndex].teamSprints[sprintIndex].boardFeatures.splice(atIndex, 0, insertIssue);
            // console.log(toJS(this.projects[projectIndex].teamSprints[sprintIndex].boardFeatures))
            this.setConnectionsWhenDrag({
              ...insertIssue,
              sprintId: this.sprints[sprintIndex].sprintId,
              teamProjectId: this.projects[projectIndex].projectId
            })
          }
        })
      })
    })
  }
  @action setConnectionsWhenDrag(issue) {
    this.connections.forEach(connection => {
      const { boardFeature, dependBoardFeature } = connection;
      if (boardFeature.id === issue.id) {
        boardFeature.sprintId = issue.sprintId
        boardFeature.teamProjectId = issue.teamProjectId
      }
      if (dependBoardFeature.id === issue.id) {
        boardFeature.sprintId = issue.sprintId
        boardFeature.teamProjectId = issue.teamProjectId
      }
    })
  }
  @action clearMovingIssue = (id) => {
    this.projects.forEach(project => {
      project.teamSprints.forEach(sprint => {
        sprint.boardFeatures.forEach((issue, i) => {
          if (issue.id === id) {
            sprint.boardFeatures.splice(i, 1)
            this.setConnectionsWhenDrag(issue)
          }
        })
      })
    })
  }
  @action resetMovingIssue = ({
    issue, sprintId, projectId, index
  }) => {

    this.clearMovingIssue(issue.id);
    const dropIssues = this.findIssuesByProjectAndSprint(projectId, sprintId);
    if (!find(dropIssues, { id: issue.id })) {
      dropIssues.splice(index, 0, issue)
    }
  }
  @action addIssueToBoard = ({
    issue: insertIssue, atIndex, projectIndex, sprintIndex,
  }) => {
    this.projects.forEach(project => {
      project.teamSprints.forEach(sprint => {
        sprint.boardFeatures.forEach((issue, i) => {
          // 找到之前不在板上的，删掉
          if (!issue.id && issue.issueId === insertIssue.issueId) {
            sprint.boardFeatures.splice(i, 1)
          }
        })
      })
    })
    this.projects[projectIndex].teamSprints[sprintIndex].boardFeatures.splice(atIndex, 0, insertIssue);
  }
  // feature列表移动到板子上
  fromSideToBoard = ({
    dropType, index, teamProjectId, sprintId, featureId
  }) => {
    let insertIndex = index;
    const data = {
      // dropType,
      // index,
      teamProjectId,
      sprintId,
      piId: this.activePi.piId,  //piId
      before: true,  //是否拖动到第一个
      teamProjectId,  //团队项目id
      featureId,
      outsetId: 0  //before：true，在当前移动的值之后，false，在当前移动的值之前，若为0L则为第一次创建
    }

    const dropIssues = this.findIssuesByProjectAndSprint(teamProjectId, sprintId)
    console.log(dropIssues)
    // 内部有卡片
    if (dropType === 'inner') {
      // 拖动到第一个，传第二个的值
      if (index === 0) {
        data.before = true;
        data.outsetId = dropIssues[1].id
      } else {
        data.before = false;
        data.outsetId = dropIssues[index - 1].id
      }
    } else {
      // 目标各自如果有issue，放在最后一个
      if (dropIssues.length > 0) {
        data.before = false;
        data.outsetId = dropIssues[dropIssues.length - 1].id;
        insertIndex = dropIssues.length - 1;
      } else {
        data.before = true;
        insertIndex = 0;
      }
    }
    console.log(data)
    featureToBoard(data).then(res => {
      if (res.failed) {
        return;
      }
      action(() => {
        dropIssues[insertIndex] = res;
        console.log(dropIssues)
      })()
    })
  }

  // feature在板子上移动
  featureBoardMove = ({
    dropType, index, teamProjectId, sprintId, issue
  }) => {
    let insertIndex = index;
    const data = {
      objectVersionNumber: issue.objectVersionNumber,  //乐观锁
      piId: this.activePi.piId,  //piId
      sprintId,  //冲刺id
      before: true,  //是否拖动到第一个
      teamProjectId,
      outsetId: 0,
    }

    const dropIssues = this.findIssuesByProjectAndSprint(teamProjectId, sprintId)
    console.log(dropIssues)
    // 内部有卡片
    if (dropType === 'inner') {
      // 拖动到第一个，传第二个的值
      if (index === 0) {
        data.before = true;
        data.outsetId = dropIssues[1].id
      } else {
        data.before = false;
        data.outsetId = dropIssues[index - 1].id
      }
    } else {
      // 目标各自如果有issue，放在最后一个
      if (dropIssues.length > 0) {
        data.before = false;
        data.outsetId = dropIssues[dropIssues.length - 1].id;
        insertIndex = dropIssues.length - 1;
      } else {
        data.before = true;
        insertIndex = 0;
      }
    }
    console.log(data, issue)
    featureBoardMove(issue.id, data).then(res => {
      if (res.failed) {
        return;
      }
      action(() => {
        dropIssues[insertIndex] = res;
        console.log(dropIssues)
      })()
    })
  }


  findIssuesByProjectAndSprint(projectId, sprintId) {
    const targetProject = find(this.projects, { projectId })
    const targetSprint = find(targetProject.teamSprints, { sprintId })
    return targetSprint.boardFeatures
  }
  @computed get getProjectsHeight() {
    return this.projects.map((project) => {
      const { teamSprints } = project;
      const maxHeight = max(teamSprints.map((sprint, i) => Math.ceil(sprint.boardFeatures.length / this.sprints[i].columnWidth)));
      return maxHeight;
    });
  }
}


export default new BoardStore();
