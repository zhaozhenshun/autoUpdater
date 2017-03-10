child = require('child_process');
exports.spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = child.spawn(command, args);
    } catch (error) {}

    return spawnedProcess;
};