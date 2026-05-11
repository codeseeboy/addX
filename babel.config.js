module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin must be listed LAST.
    // (It's the Reanimated 4 successor to react-native-reanimated/plugin.)
    plugins: ['react-native-worklets/plugin'],
  };
};
