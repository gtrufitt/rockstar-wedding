const contentful = require('contentful');

var getPageData = function(options) {
  if (options.contentfulPageId === undefined) {
    return Promise.resolve({});
  }

  return options.client
      .getEntries({
          content_type: options.contentfulPageId
      })
      .then(pageData => pageData.items && pageData.items[0].fields || {})
}

module.exports = getPageData;
