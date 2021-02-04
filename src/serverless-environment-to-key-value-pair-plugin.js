'use strict';
/**
 * Converts all environment variables to KeyValuePair and set it in the path specified in
 * custom.environmentToKeyValuePair array value
 * https://docs.aws.amazon.com/en_pv/AmazonECS/latest/APIReference/API_KeyValuePair.html
 *
 * Example:
 *
 * ```
 * provider:
 *  environment:
 *    VAR_1: value1
 *    VAR_2: value2
 *
 * custom:
 *  environmentToKeyValuePair:
 *    - resources.Resources.ECSTaskDefinition.Properties.ContainerDefinitions.[].Environment
 * resources:
 *  Resources:
 *    ECSTaskDefinition:
 *      Properties:
 *        ContainerDefinitions:
 *          - Name: container-1
 *            Environment: ???
 *          - Name: container-2
 *            Environment: ???
 * ```
 *
 * Will generate:
 *
 * ```
 * resources:
 *  Resources:
 *    ECSTaskDefinition:
 *      Properties:
 *        ContainerDefinitions:
 *          - Name: container-1
 *            Environment:
 *            - Name: VAR_1
 *              Value: value1
 *            - Name: VAR_2
 *              Value: value2
 *          - Name: container-2
 *            Environment:
 *            - Name: VAR_1
 *              Value: value1
 *            - Name: VAR_2
 *              Value: value2
 * ```
 */
class EnvironmentToKeyValuePairPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'after:package:initialize': this.hook.bind(this)
    };
  }

  hook() {
    const environment = this.serverless.service.provider.environment;
    const destinations = this.serverless.service.custom.environmentToKeyValuePair || [];

    const keyValuePairs = Object.entries(environment)
      .map(([Name, Value]) => ({ Name, Value }));

    destinations.forEach(destination => {
      setter(this.serverless.service, destination, keyValuePairs);
    });
  }
}

const setter = (object, path, value) => {
  if (typeof path == 'string')
    setter(object, path.split('.'), value);
  else if (path.length > 1) {
    if (path[0] === '[]')
      object.forEach(item => setter(item, path.slice(1), value));
    else
      setter(object[path[0]], path.slice(1), value);
  } else {
    const existing = object[path[0]];
    object[path[0]] = existing ? existing.concat(...value) : value;
  }
};

module.exports = EnvironmentToKeyValuePairPlugin;
