import appPackage from '../../package.json';

export const SERVER_URL = process.env.REACT_APP_DOOR43_SERVER_URL;

const config = {
  authentication: {
    server: SERVER_URL,
    tokenid: appPackage.name,
  },
  repository: {
    urls: [
      SERVER_URL + '/api/v1/repos/unfoldingword/en_ta',
      SERVER_URL + '/api/v1/repos/unfoldingword/en_tw',
      SERVER_URL + '/api/v1/repos/unfoldingword/en_tn',
      SERVER_URL + '/api/v1/repos/unfoldingword/en_tq',
      SERVER_URL + '/api/v1/repos/unfoldingword/en_obs',
      SERVER_URL + '/api/v1/repos/unfoldingword/en_obs-tq',
      SERVER_URL + '/api/v1/repos/unfoldingword/en_obs-tn',
      SERVER_URL + '/api/v1/repos/unfoldingword/en_obs-sn',
      SERVER_URL + '/api/v1/repos/unfoldingword/en_obs-sq',
    ],
  },
};

export default {
  validationPriority: 'high',
  expandedScripture: true,
  fontScale: 100,
  config,
};
